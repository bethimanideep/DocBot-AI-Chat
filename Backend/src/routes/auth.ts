import dotenv from "dotenv";
dotenv.config();
import { Router } from "express";
import passport from "../config/passport";
import jwt from "jsonwebtoken";
import { User, UserFile } from "../models/schema"; // Import the updated User model
import { hashPassword, verifyPassword } from "../utils/hash";
import { sendOTP } from "../utils/otp";
import { google } from "googleapis";

const router = Router();

// Google Sign-In (Basic Profile and Email)
router.get(
  "/google",
  passport.authenticate("google-signin", { scope: ["profile", "email"] })
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
      const accessToken = userProfile.accessToken; // Access token from Google
      
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
      const token = jwt.sign({ email: userEmail }, process.env.JWT_SECRET!, {
        expiresIn: "1h",
      });

      // Set tokens in cookies
      res.cookie("token", token, {
        httpOnly: true,
        secure: true, // Use HTTPS in production
        sameSite: "none", // For cross-domain requests
      });
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true, // Use HTTPS in production
        sameSite: "none", // For cross-domain requests
      });

      // Redirect to your frontend or another desired route
      res.redirect("http://localhost:3000"); // Change this to the frontend URL or another route
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
      const accessToken = userProfile.accessToken; // Access token from Google

      // Update the access token in cookies
      res.cookie("driveAccessToken", accessToken, {
        httpOnly: true,
        secure: true, // Use HTTPS in production
        sameSite: "none", // For cross-domain requests
      });

      // Redirect to your frontend or another desired route
      res.redirect("http://localhost:3000"); // Change this to the frontend URL or another route
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

router.get("/google/drive/files", async (req: any, res: any) => {
  try {
    const accessToken = req.cookies.driveAccessToken; // Get access token from cookies
    console.log({ accessToken });

    if (!accessToken) {
      return res.status(401).json({ error: "Unauthorized: No access token provided" });
    }

    // Initialize OAuth2 client with the provided access token
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    // Create a Google Drive API client
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Fetch PDF files from Google Drive with additional fields
    const response = await drive.files.list({
      q: "mimeType='application/pdf'",
      fields: "files(id, name, webViewLink, size, mimeType)", // Include size and mimeType
    });

    // Map the response to include fileSize and mimeType
    const pdfFiles = response.data.files?.map((file: any) => ({
      id: file.id,
      name: file.name,
      webViewLink: file.webViewLink,
      fileSize: file.size ? parseInt(file.size) : 0, // Convert size to a number
      mimeType: file.mimeType || 'application/pdf', // Default to 'application/pdf'
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

    // Set tokens in cookies
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
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

      // Set tokens in cookies
      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
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
  res.clearCookie("driveAccessToken", { httpOnly: true, secure: true, sameSite: "none" });

  return res.status(200).json({ message: "Logout successful" });
});

export default router;