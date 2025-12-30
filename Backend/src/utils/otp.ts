import crypto from "crypto";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL, // Use environment variables
    pass: process.env.PASSWORD,
  },
});


export const sendOTP = async (user: any, email: string) => {
  try {
    
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60000); // OTP valid for 10 minutes

    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is: ${otp}`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}`);
  } catch (error) {
    console.error("Error sending OTP email:", error);
  }
};

// Send password reset email with single-use token
export const sendPasswordReset = async (user: any, email: string, token: string) => {
  try {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    // Set token and expiry on user (1 hour)
    user.resetToken = token;
    user.resetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Password Reset Request",
      text: `You requested a password reset. Click the link to reset your password (valid for 1 hour): ${resetLink}`,
      html: `<p>You requested a password reset. Click the link to reset your password (valid for 1 hour):</p><p><a href="${resetLink}">${resetLink}</a></p>`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error("Error sending password reset email:", error);
  }
};
