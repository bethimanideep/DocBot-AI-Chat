import dotenv from "dotenv";
dotenv.config();
import { Router } from "express";
import passport from "../config/passport";
import jwt from "jsonwebtoken";
import { GoogleDriveFile, User, UserFile } from "../models/schema"; // Import the updated User model
import { hashPassword, verifyPassword } from "../utils/hash";
import crypto from "crypto";

const router = Router();

// Google Drive Connection (Additional Permissions)
router.get(
  "/google/drive",
  passport.authenticate("google-drive", { scope: ["profile", "email", "https://www.googleapis.com/auth/drive.readonly"] ,session: false})
);

// Google Drive Callback
router.get("/google/drive/callback",passport.authenticate("google-drive", { failureRedirect: "/",session: false }),async (req, res) => {
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
    // 1. Check if token cookie exists
    const tokenCookie = req.cookies.token;
    
    if (!tokenCookie) {
      return res.status(401).json({ error: "Unauthorized: Token not provided" });
    }

    let decoded: any;
    try {
      // 2. Verify token
      decoded = jwt.verify(tokenCookie, process.env.JWT_SECRET!);
    } catch (err: any) {
      // Token exists but is invalid / expired
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Session expired. Please login again." });
      }

      if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ error: "Invalid token. Please login again." });
      }

      return res.status(401).json({ error: "Unauthorized" });
    }

    // 3. Validate decoded payload
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: "Unauthorized: Invalid token payload" });
    }

    const userId = decoded.userId;

    const driveAccessToken = req.cookies.DriveAccessToken;
    if (!driveAccessToken) {
      return res.status(401).json({ error: "Unauthorized: No access token provided" });
    }

    const { google } = require("googleapis");
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: driveAccessToken,
    });

    const drive = google.drive({ version: "v3", auth: oauth2Client });
    
    // Fetch PDF, images, and Word files (exclude folders & trashed)
    const response = await drive.files.list({
      q: "(mimeType='application/pdf' OR mimeType contains 'image/' OR mimeType contains 'officedocument' OR mimeType = 'application/msword') AND trashed = false AND mimeType != 'application/vnd.google-apps.folder'",
      fields: "files(id, name, webViewLink, size, mimeType, thumbnailLink)",
    });

    if (!response.data.files) {
      return res.json({ driveFiles: [] });
    }

    // Collect all file IDs
    const fileIds = response.data.files.map((file: any) => file.id);

    // Find all synced files from MongoDB
    const syncedFiles = await GoogleDriveFile.find({
      userId,
      fileId: { $in: fileIds },
    });

    // Build map of fileId → synced
    const syncStatusMap = new Map<string, boolean>();
    syncedFiles.forEach((file: any) => {
      syncStatusMap.set(file.fileId, file.synced);
    });

    // Prepare final response
    const driveFiles = response.data.files.map((file: any) => ({
      id: file.id,
      name: file.name,
      webViewLink: file.webViewLink,
      thumbnailLink: file.thumbnailLink,
      fileSize: file.size ? parseInt(file.size) : 0,
      mimeType: file.mimeType || "application/pdf",
      synced: syncStatusMap.get(file.id) || false,
    }));

    return res.json({ driveFiles });
    
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

      // Generate OTP and store for email service to send
      const otp = crypto.randomInt(100000, 999999).toString();
      const otpExpiresAt = new Date(Date.now() + 10 * 60000);

      user.otp = otp;
      user.otpExpiresAt = otpExpiresAt;
      await user.save();

      return res.status(200).json({ message: "OTP sent to your email" });
    }

    // Verify Password
    const isMatch = await verifyPassword(password, user.password!);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect password" });
    }

    // If user is not verified, generate OTP for email service to send
    if (!user.verified) {
      const otp = crypto.randomInt(100000, 999999).toString();
      const otpExpiresAt = new Date(Date.now() + 10 * 60000);

      user.otp = otp;
      user.otpExpiresAt = otpExpiresAt;
      await user.save();

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

// Store OTP from email service
router.post("/store-otp", async (req:any, res:any) => {
  const { email, otp, expiresAt } = req.body;

  if (!email || !otp || !expiresAt) {
    return res.status(400).json({ error: "Email, OTP, and expiresAt are required" });
  }

  try {
    const user = await User.findOne({ email, authenticationType: "email" });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    user.otp = otp;
    user.otpExpiresAt = new Date(expiresAt);
    await user.save();

    console.log(`OTP stored for ${email}: ${otp}`);
    return res.status(200).json({ message: "OTP stored successfully" });
  } catch (error) {
    console.error("Error storing OTP:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Store password reset token from email service  
router.post("/store-reset-token", async (req:any, res:any) => {
  const { email, token, resetLink } = req.body;

  if (!email || !token) {
    return res.status(400).json({ error: "Email and token are required" });
  }

  try {
    const user = await User.findOne({ email, authenticationType: "email" });

    if (!user) {
      return res.status(200).json({ message: "If an account exists, token stored" });
    }

    user.resetToken = token;
    user.resetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    console.log(`Password reset token stored for ${email}: ${token}`);
    return res.status(200).json({ message: "Reset token stored successfully" });
  } catch (error) {
    console.error("Error storing reset token:", error);
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
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
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
  res.clearCookie("DriveAccessToken", { httpOnly: true, secure: true, sameSite: "none" });
  return res.status(200).json({ message: "Logout successful" });
});
router.post("/drivelogout", (req:any, res:any) => {
  try {
    
    res.clearCookie("DriveAccessToken", { httpOnly: true, secure: true, sameSite: "none" });
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ error: error});
  }

});

// Forgot password - generate token for email service to send
router.post("/forgot-password", async (req:any, res:any) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
  const user = await User.findOne({ email, authenticationType: "email" });

    // Always respond with success message to avoid revealing account existence
    if (!user) {
      return res.status(200).json({ message: "If an account with that email exists, a reset link has been sent." });
    }

    // Generate secure token for email service to use
    const token = crypto.randomBytes(32).toString("hex");
    
    user.resetToken = token;
    user.resetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    return res.status(200).json({ message: "If an account with that email exists, a reset link has been sent." });
  } catch (error) {
    console.error("Error in /forgot-password:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Reset password - accept token and new password
router.post("/reset-password", async (req:any, res:any) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: "Token and new password are required" });

  try {
    const user = await User.findOne({ resetToken: token, resetExpires: { $gt: new Date() } }).select('+password');
    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    // Hash and update password
    const hashed = await hashPassword(password);
    user.password = hashed as any;
    // Clear reset token fields so the link cannot be reused
    user.resetToken = undefined;
    user.resetExpires = undefined;
    user.verified = true; // mark verified if resetting
    await user.save();

    return res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Error in /reset-password:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/files", async (req: any, res: any) => {
  try {
    // 1. Check if token cookie exists
    const token = req.cookies?.token;
  
    if (!token) {
      return res.status(401).json({
        error: "Unauthorized: Token not provided",
      });
    }

    let decoded: any;
    try {
      // 2. Verify token
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err: any) {
      // Token exists but is invalid / expired
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          error: "Session expired. Please login again.",
        });
      }

      if (err.name === "JsonWebTokenError") {
        return res.status(401).json({
          error: "Invalid token. Please login again.",
        });
      }

      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    // 3. Validate decoded payload
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        error: "Unauthorized: Invalid token payload",
      });
    }

    // 4. Fetch files
    const files = await UserFile.find({ userId: decoded.userId });

    res.json({ files });
  } catch (error) {
    console.error("Error in /files:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});




export default router;