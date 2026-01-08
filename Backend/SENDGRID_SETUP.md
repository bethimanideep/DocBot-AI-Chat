# SendGrid Email Service Setup Guide

## Overview
This project uses **SendGrid** (https://sendgrid.com) for sending transactional emails. SendGrid is a reliable email service that works perfectly with Render and other cloud platforms.

## Why SendGrid?
- ✅ **Render Compatible**: Works on Render without SMTP restrictions
- ✅ **Free Tier**: 100 emails/day free
- ✅ **Simple API**: Easy to integrate
- ✅ **Reliable**: Built for transactional emails
- ✅ **Easy Integration**: Just API key required

## Setup Steps

### 1. Create SendGrid Account
1. Go to https://sendgrid.com
2. Sign up with your email
3. Verify your email

### 2. Get Your API Key
1. Go to Settings → API Keys
2. Create a new API Key with "Mail Send" permissions
3. Copy your API Key (starts with `SG.`)
4. Keep it secure! You won't be able to see it again.

### 3. Add Environment Variables

Add these to your `.env` file:

```env
SENDGRID_API_KEY=SG.your_api_key_here
SENDER_EMAIL=noreply@yourdomain.com
```

**Note**: 
- Replace `SG.your_api_key_here` with your actual SendGrid API key
- For `SENDER_EMAIL`, you can use:
  - Default: Use a verified sender email from SendGrid dashboard
  - Custom domain: Verify your domain in SendGrid dashboard first

### 4. Install Dependencies

```bash
cd Backend
npm install
# This will install @sendgrid/mail package
```

### 5. Deploy to Render

1. Update your Render environment variables:
   - `SENDGRID_API_KEY` = your API key
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
- Check that `SENDGRID_API_KEY` is set correctly in `.env`
- Ensure no extra spaces or quotes around the key
- Verify the API key has "Mail Send" permissions

### Emails Not Sending
- Check SendGrid dashboard for failed sends
- Verify `SENDER_EMAIL` is set in `.env`
- For custom domains, make sure domain is verified in SendGrid
- Check that sender email is verified in SendGrid dashboard

### Rate Limiting (Free Tier)
- Free tier: 100 emails/day limit
- Upgrade if needed for production

## Code Changes

The following changes were made:
- Using `@sendgrid/mail` package
- Updated email sending in `/auth/login` OTP
- Updated email sending in `/auth/forgot-password`
- SendGrid is initialized at the top of `auth.ts`

## Documentation
- SendGrid Docs: https://docs.sendgrid.com
- API Reference: https://docs.sendgrid.com/api-reference
