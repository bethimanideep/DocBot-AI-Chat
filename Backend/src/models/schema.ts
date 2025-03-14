import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true, required: true, trim: true },
    email: { type: String, unique: true, required: true, trim: true, lowercase: true },
    authenticationType: { type: String, required: true, enum: ['google', 'github', 'email'] },
    password: { type: String, select: false }, // Only for email/password authentication
    otp: { type: String, select: false }, // For OTP-based verification
    otpExpiresAt: { type: Date, select: false }, // OTP expiration time
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
    mimeType: { type: String, required: true, default: 'application/pdf' },
    uploadedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

const UserFile = mongoose.model('UserFile', userFileSchema);
const User = mongoose.model('User', userSchema);

export { User ,UserFile};
