"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
// For Google Sign-In
passport_1.default.use('google-signin', new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:4000/auth/google/callback', // Full URL
    scope: ['profile', 'email'],
}, (accessToken, refreshToken, profile, done) => {
    profile.accessToken = accessToken;
    done(null, profile);
}));
// For Google Drive
passport_1.default.use('google-drive', new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:4000/auth/google/drive/callback', // Full URL
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/drive.readonly'],
}, (accessToken, refreshToken, profile, done) => {
    profile.accessToken = accessToken;
    done(null, profile);
}));
// Serialize and deserialize user
passport_1.default.serializeUser((user, done) => {
    done(null, user);
});
passport_1.default.deserializeUser((user, done) => {
    done(null, user);
});
exports.default = passport_1.default;
