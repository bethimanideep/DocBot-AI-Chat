import mongoose from "mongoose";

/* ---------------- USER ---------------- */
const userSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true, required: true, trim: true },
    email: { type: String, unique: true, required: true, trim: true, lowercase: true },
    authenticationType: { type: String, required: true, enum: ["google", "github", "email"] },
    password: { type: String, select: false },
    otp: { type: String, select: false },
    otpExpiresAt: { type: Date, select: false },
    resetToken: { type: String, select: false },
    resetExpires: { type: Date, select: false },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/* ---------------- USER FILES (PRIVATE) ---------------- */
const userFileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    filename: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true, default: "application/pdf" },
    processed: { type: Boolean, default: false },
    synced: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/* ---------------- GOOGLE DRIVE FILES ---------------- */
const googleDriveFileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fileId: { type: String, required: true },
    filename: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    webViewLink: { type: String },
    webContentLink: { type: String },
    thumbnailLink: { type: String },
    lastSynced: { type: Date },
    synced: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/* ---------------- PUBLIC FILES (for /myuserupload) ---------------- */
const publicFileSchema = new mongoose.Schema(
  {
    socketId: { type: String, required: true, index: true }, // instead of userId
    filename: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    processed: { type: Boolean, default: false },
    synced: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/* ---------------- VISIT STATS ---------------- */
const visitStatSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "site" },
    totalVisits: { type: Number, default: 0 },
  },
  { timestamps: true }
);

/* ---------------- MODELS ---------------- */
const User = mongoose.model("User", userSchema);
const UserFile = mongoose.model("LocalFile", userFileSchema);
const GoogleDriveFile = mongoose.model("GoogleDriveFile", googleDriveFileSchema);
const PublicFiles = mongoose.model("PublicFiles", publicFileSchema);
const VisitStat = mongoose.model("VisitStat", visitStatSchema);

export {
  User,
  UserFile,
  GoogleDriveFile,
  PublicFiles,   // 👈 new model for /myuserupload
  VisitStat,
};
