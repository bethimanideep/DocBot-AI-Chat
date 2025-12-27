import dotenv from "dotenv";
dotenv.config();
import { Router } from "express";
import passport from "../config/passport";
import jwt from "jsonwebtoken";
import { GoogleDriveFile, User, UserFile } from "../models/schema"; // Import the updated User model
import { hashPassword, verifyPassword } from "../utils/hash";
import { sendOTP } from "../utils/otp";
import { google } from "googleapis";

const router = Router();

// Google Sign-In (Basic Profile and Email)
router.get(
  "/google",
  passport.authenticate("google-signin", { scope: ["profile", "email"]  ,prompt:"select_account"})
);

// Google Sign-In Callback
router.get(
  "/google/callback",
  passport.authenticate("google-signin", { failureRedirect: "/" }),
  async (req, res) => {
    try {
      const userProfile = req.user as any; // Keeping profile type as any
      const userEmail = userProfile.emails[0].value; // Accessing user's email
      const username = userProfile.displayName;
      const GoogleaccessToken = userProfile.GoogleaccessToken; // Access token from Google
      
      // Check if the user already exists in MongoDB
      let user = await User.findOne({ email: userEmail });
      if (!user) {
        // If user does not exist, create a new user
        user = new User({
          username: username,
          email: userEmail,
          authenticationType: "google",
          verified: true, // Google users are verified by default
        });
        await user.save();
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
        expiresIn: "1h",
      });
      res.cookie("username", username, {
       httpOnly: false, secure: true, sameSite: "none"
      });
      res.cookie("userId", user._id.toString(), {
        httpOnly: false, secure: true, sameSite: "none"
      });
      
      // Set tokens in cookies
      res.cookie("token", token, {
       httpOnly: false, secure: true, sameSite: "none"
      });
      res.cookie("GoogleaccessToken", GoogleaccessToken, {
        httpOnly: false, secure: true, sameSite: "none"
      });

      // Create redirect URL with params
      const frontendUrl = new URL(String(process.env.FRONTEND_URL));
      frontendUrl.searchParams.append("username", encodeURIComponent(username));
      frontendUrl.searchParams.append("userId", user._id.toString());

      // Redirect to your frontend with params
      res.redirect(frontendUrl.toString());
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

// Google Drive Connection (Additional Permissions)
router.get(
  "/google/drive",
  passport.authenticate("google-drive", { scope: ["profile", "email", "https://www.googleapis.com/auth/drive.readonly"] })
);

// Google Drive Callback
router.get("/google/drive/callback",passport.authenticate("google-drive", { failureRedirect: "/" }),async (req, res) => {
    try {
      const userProfile = req.user as any; // Keeping profile type as any
      const DriveAccessToken = userProfile.DriveAccessToken; // Access token from Google

      // Update the access token in cookies
      res.cookie("DriveAccessToken", DriveAccessToken, {
        httpOnly: true,
        secure: true, // Use HTTPS in production
        sameSite: "none", // For cross-domain requests
      });

      // Redirect to your frontend or another desired route
      res.redirect(String(process.env.FRONTEND_URL)); // Change this to the frontend URL or another route
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

router.get("/google/drive/files", async (req: any, res: any) => {
  try {
    const userId = req.user?._id; // Assuming user is authenticated and userId is available
    console.log({cookies:req.cookies});
    
    if (!req.cookies.DriveAccessToken) {
      return res.status(401).json({ error: "Unauthorized: No access token provided" });
    }

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: req.cookies.DriveAccessToken });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Fetch PDF files from Google Drive
    const response = await drive.files.list({
      q: "mimeType='application/pdf'",
      fields: "files(id, name, webViewLink, size, mimeType, thumbnailLink)",
    });

    if (!response.data.files) {
      return res.json({ pdfFiles: [] });
    }

    // Get all file IDs from the Google Drive response
    const fileIds = response.data.files.map((file: any) => file.id);

    // Find all synced files from MongoDB that match these file IDs
    const syncedFiles = await GoogleDriveFile.find({
      userId,
      fileId: { $in: fileIds }
    });

    // Create a map of fileId to sync status
    const syncStatusMap = new Map();
    syncedFiles.forEach(file => {
      syncStatusMap.set(file.fileId, file.synced);
    });

    // Prepare the response with sync status
    const pdfFiles = response.data.files.map((file: any) => ({
      id: file.id,
      name: file.name,
      webViewLink: file.webViewLink,
      thumbnailLink: file.thumbnailLink,
      fileSize: file.size ? parseInt(file.size) : 0,
      mimeType: file.mimeType || 'application/pdf',
      synced: syncStatusMap.get(file.id) || false
    }));

    return res.json({ pdfFiles });
  } catch (error) {
    console.error("Error fetching files from Google Drive:", error);
    return res.status(500).json({ error: "Failed to fetch Google Drive files" });
  }
});

// Email/Password Login
router.post("/login", async (req:any, res:any) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    let user = await User.findOne({ email, authenticationType: "email" }).select("+password");
    const username=email.split("@")[0];
    // If user does not exist, create new and send OTP
    if (!user) {
      const hashedPassword = await hashPassword(password);

      user = new User({
        username,
        email,
        password: hashedPassword,
        authenticationType: "email",
        verified: false, // Initially unverified
      });

      await sendOTP(user, email);
      return res.status(200).json({ message: "OTP sent to your email" });
    }

    // Verify Password
    const isMatch = await verifyPassword(password, user.password!);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect password" });
    }

    // If user is not verified, send OTP
    if (!user.verified) {
      await sendOTP(user, email);
      return res.status(200).json({ message: "OTP sent to your email" });
    }

    // Generate JWT tokens
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );
    console.log(token,refreshToken);
    

    // Set tokens in cookies
    res.cookie("token", token, {
      httpOnly: true,
      partitioned: true,
      secure: true,
      sameSite: "none",
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      partitioned: true,
      secure: true,
      sameSite: "none",
    });
    const fileList = await UserFile.find({ userId:user._id });

    return res.status(200).json({ message: "Login Successful", username: user.username || email.split("@")[0] ,userId:user._id,fileList});
  } catch (error) {
    console.error("Error in /login:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Verify OTP
router.post("/verify-otp", async (req:any, res:any) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  try {
    // Find the user by email
    const user = await User.findOne({ email, authenticationType: "email" }).select("+otp otpExpiresAt verified");

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // Check if OTP matches and is not expired
    if (
      user.otp === otp &&
      user.otpExpiresAt &&
      user.otpExpiresAt > new Date()
    ) {
      // Mark user as verified and clear OTP fields
      user.verified = true;
      user.otp = undefined;
      user.otpExpiresAt = undefined;
      await user.save();

      // Generate JWT tokens
      const token = jwt.sign({ email: user._id }, process.env.JWT_SECRET!, {
        expiresIn: "1h",
      });
      const refreshToken = jwt.sign(
        { email: user._id },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );
      console.log(token,refreshToken);

      // Set tokens in cookies
      res.cookie("token", token, {
        httpOnly: true,
        partitioned: true,
        secure: true,
        sameSite: "none",
      });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        partitioned: true,
        secure: true,
        sameSite: "none",
      });

      return res.status(200).json({ message: "Login Successful", username: user.username || email.split("@")[0] ,userId:user._id});
    } else {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }
  } catch (error) {
    console.error("Error in /verify-otp:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Logout
router.post("/logout", (req:any, res:any) => {
  res.clearCookie("token", { httpOnly: true, secure: true, sameSite: "none" });
  res.clearCookie("refreshToken", { httpOnly: true, secure: true, sameSite: "none" });
  res.clearCookie("DriveAccessToken", { httpOnly: true, secure: true, sameSite: "none" });

  return res.status(200).json({ message: "Logout successful" });
});

export default router;