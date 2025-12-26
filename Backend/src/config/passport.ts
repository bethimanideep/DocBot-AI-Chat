import dotenv from 'dotenv';
dotenv.config();
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

// For Google Sign-In
passport.use(
  'google-signin',
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: 'https://docbot-ai-chat.onrender.com/auth/google/callback', // Full URL
      scope: ['profile', 'email'],
    },
    (accessToken, refreshToken, profile:any, done) => {
      profile.accessToken = accessToken;
      done(null, profile);
    }
  )
);

// For Google Drive
passport.use(
  'google-drive',
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: 'https://docbot-ai-chat.onrender.com/auth/google/drive/callback', // Full URL
      scope: ['profile', 'email', 'https://www.googleapis.com/auth/drive.readonly'],
    },
    (accessToken, refreshToken, profile:any, done) => {
      profile.accessToken = accessToken;
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