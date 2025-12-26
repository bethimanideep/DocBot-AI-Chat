"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOTP = void 0;
const crypto_1 = __importDefault(require("crypto"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const transporter = nodemailer_1.default.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL, // Use environment variables
        pass: process.env.PASSWORD,
    },
});
const sendOTP = async (user, email) => {
    try {
        console.log(process.env.EMAIL, process.env.PASSWORD);
        const otp = crypto_1.default.randomInt(100000, 999999).toString();
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
    }
    catch (error) {
        console.error("Error sending OTP email:", error);
    }
};
exports.sendOTP = sendOTP;
