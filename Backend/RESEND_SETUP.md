# Resend Email Service Setup Guide

## Overview
This project now uses **Resend** (https://resend.com) instead of Gmail SMTP for sending emails. Resend works perfectly with Render and other cloud platforms without SMTP blocking issues.

## Why Resend?
- ✅ **Render Compatible**: Works on Render without SMTP restrictions
- ✅ **Free Tier**: 100 emails/day free
- ✅ **Simple API**: No need for nodemailer complexity
- ✅ **Reliable**: Built for transactional emails
- ✅ **Easy Integration**: Just API key required

## Setup Steps

### 1. Create Resend Account
1. Go to https://resend.com
2. Sign up with your email
3. Verify your email

### 2. Get Your API Key
1. Go to Dashboard → API Keys
2. Copy your API Key (starts with `re_`)
3. Keep it secure!

### 3. Add Environment Variables

Add these to your `.env` file:

```env
RESEND_API_KEY=re_your_api_key_here
SENDER_EMAIL=noreply@yourdomain.com
```

**Note**: 
- Replace `re_your_api_key_here` with your actual Resend API key
- For `SENDER_EMAIL`, you can use:
  - Default: `noreply@resend.dev` (free tier)
  - Custom domain: Verify your domain in Resend dashboard first

### 4. Install Dependencies

```bash
cd Backend
npm install
# This will install the new resend package and remove nodemailer
```

### 5. Deploy to Render

1. Update your Render environment variables:
   - `RESEND_API_KEY` = your API key
   - `SENDER_EMAIL` = your sender email
2. Deploy as usual

## Features Supported

The following email features are now working:

### ✅ OTP Email (Signup)
- Sends 6-digit OTP code
- HTML formatted email
- Expires in 10 minutes

### ✅ OTP Email (Login)
- Sends OTP for unverified accounts
- Same format as signup OTP

### ✅ Password Reset Email
- Sends secure password reset link
- Link valid for 1 hour
- HTML formatted with clickable link

## Testing Locally

During development, emails are sent asynchronously (fire and forget). Check your logs for:
```
OTP sent to user@example.com
```

## Troubleshooting

### "Invalid API Key" Error
- Check that `RESEND_API_KEY` is set correctly in `.env`
- Ensure no extra spaces or quotes around the key

### Emails Not Sending
- Check Resend dashboard for failed sends
- Verify `SENDER_EMAIL` is set in `.env`
- For custom domains, make sure domain is verified in Resend

### Rate Limiting (Free Tier)
- Free tier: 100 emails/day limit
- Upgrade if needed for production

## Code Changes

The following changes were made:
- Replaced `nodemailer` with `resend` package
- Updated email sending in `/auth/signup` OTP
- Updated email sending in `/auth/login` OTP
- Updated email sending in `/auth/forgot-password`
- Removed Gmail SMTP configuration

## Documentation
- Resend Docs: https://resend.com/docs
- API Reference: https://resend.com/docs/api-reference
