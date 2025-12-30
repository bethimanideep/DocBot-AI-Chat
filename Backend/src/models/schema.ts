import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true, required: true, trim: true },
    email: { type: String, unique: true, required: true, trim: true, lowercase: true },
    authenticationType: { type: String, required: true, enum: ['google', 'github', 'email'] },
    password: { type: String, select: false }, // Only for email/password authentication
    otp: { type: String, select: false }, // For OTP-based verification
    otpExpiresAt: { type: Date, select: false }, // OTP expiration time
  // Password reset token (single-use) and expiration
  resetToken: { type: String, select: false },
  resetExpires: { type: Date, select: false },
    verified: { type: Boolean, default: false }, // Whether the user is verified
  },
  {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
  }
);
const userFileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },
    fileSize: { type: Number, required: true }, // In bytes
    mimeType: { type: String, required: true, default: 'application/pdf' }
  },
  {
    timestamps: true,
  }
);
const googleDriveFileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileId: { type: String, required: true },
    filename: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    webViewLink: { type: String },
    webContentLink: { type: String },
    thumbnailLink: { type: String },
    lastSynced: { type: Date },
    synced: { type: Boolean, default: false } // Add this new field
  },
  {
    timestamps: true,
  }
);

const GoogleDriveFile = mongoose.model('GoogleDriveFile', googleDriveFileSchema);


const UserFile = mongoose.model('LocalFile', userFileSchema);
const User = mongoose.model('User', userSchema);

// Simple VisitStat model to keep a single document with total visits
const visitStatSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'site' },
    totalVisits: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const VisitStat = mongoose.model('VisitStat', visitStatSchema);

export { User, UserFile, GoogleDriveFile, VisitStat };
