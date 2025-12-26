"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleDriveFile = exports.UserFile = exports.User = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const userSchema = new mongoose_1.default.Schema({
    username: { type: String, unique: true, required: true, trim: true },
    email: { type: String, unique: true, required: true, trim: true, lowercase: true },
    authenticationType: { type: String, required: true, enum: ['google', 'github', 'email'] },
    password: { type: String, select: false }, // Only for email/password authentication
    otp: { type: String, select: false }, // For OTP-based verification
    otpExpiresAt: { type: Date, select: false }, // OTP expiration time
    verified: { type: Boolean, default: false }, // Whether the user is verified
}, {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
});
const userFileSchema = new mongoose_1.default.Schema({
    userId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },
    fileSize: { type: Number, required: true }, // In bytes
    mimeType: { type: String, required: true, default: 'application/pdf' }
}, {
    timestamps: true,
});
const googleDriveFileSchema = new mongoose_1.default.Schema({
    userId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    fileId: { type: String, required: true },
    filename: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    webViewLink: { type: String },
    webContentLink: { type: String },
    thumbnailLink: { type: String },
    lastSynced: { type: Date },
    synced: { type: Boolean, default: false } // Add this new field
}, {
    timestamps: true,
});
const GoogleDriveFile = mongoose_1.default.model('GoogleDriveFile', googleDriveFileSchema);
exports.GoogleDriveFile = GoogleDriveFile;
const UserFile = mongoose_1.default.model('LocalFile', userFileSchema);
exports.UserFile = UserFile;
const User = mongoose_1.default.model('User', userSchema);
exports.User = User;
