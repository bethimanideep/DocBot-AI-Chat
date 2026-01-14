import dotenv from 'dotenv';
dotenv.config();
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

// For Google Drive
passport.use(
  'google-drive',
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${process.env.BACKEND_URL}/auth/google/drive/callback`, // Full URL
      scope: ['profile', 'email', 'https://www.googleapis.com/auth/drive.readonly'],
    },
    (accessToken, refreshToken, profile:any, done) => {
      profile.DriveAccessToken = accessToken;
      done(null, profile);
    }
  )
);

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

export default passport;