// Email Template Utilities
export const emailTemplates = {
  // OTP Email Template
  otp: (otp: string, appName: string = "DocBot AI") => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your OTP Code</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 30px 20px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      color: #333;
      margin-bottom: 20px;
    }
    .otp-section {
      background-color: #f9f9f9;
      border-left: 4px solid #667eea;
      padding: 25px;
      margin: 30px 0;
      border-radius: 4px;
      text-align: center;
    }
    .otp-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #999;
      margin-bottom: 10px;
    }
    .otp-code {
      font-size: 48px;
      font-weight: 700;
      color: #667eea;
      letter-spacing: 8px;
      font-family: 'Courier New', monospace;
      margin: 0;
    }
    .expiry-warning {
      background-color: #fff3cd;
      border: 1px solid #ffc107;
      color: #856404;
      padding: 12px 15px;
      border-radius: 4px;
      font-size: 14px;
      margin: 20px 0;
      text-align: center;
    }
    .security-note {
      background-color: #e8f4f8;
      border-left: 4px solid #17a2b8;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
      font-size: 13px;
      color: #0c5460;
    }
    .security-note strong {
      display: block;
      margin-bottom: 5px;
    }
    .footer {
      background-color: #f5f5f5;
      padding: 20px 30px;
      text-align: center;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #999;
    }
    .footer p {
      margin: 5px 0;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 600;
      margin: 15px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${appName}</h1>
    </div>
    
    <div class="content">
      <div class="greeting">
        👋 Hello!
      </div>
      
      <p>We received a request to verify your account. Use the following One-Time Password (OTP) to complete your verification:</p>
      
      <div class="otp-section">
        <div class="otp-label">Your Verification Code</div>
        <div class="otp-code">${otp}</div>
      </div>
      
      <div class="expiry-warning">
        ⏱️ This code expires in <strong>10 minutes</strong>
      </div>
    </div>
    
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `,

  // Password Reset Email Template
  passwordReset: (resetLink: string, appName: string = "DocBot AI") => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 30px 20px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      color: #333;
      margin-bottom: 20px;
    }
    .reset-section {
      background-color: #f9f9f9;
      padding: 30px;
      margin: 30px 0;
      border-radius: 4px;
      text-align: center;
    }
    .reset-button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      margin: 15px 0;
      transition: opacity 0.3s ease;
    }
    .reset-button:hover {
      opacity: 0.9;
    }
    .link-text {
      font-size: 12px;
      color: #999;
      word-break: break-all;
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px solid #eee;
    }
    .link-text span {
      font-family: 'Courier New', monospace;
      background-color: #f5f5f5;
      padding: 8px 12px;
      border-radius: 4px;
      display: block;
      margin-top: 10px;
    }
    .expiry-info {
      background-color: #fff3cd;
      border: 1px solid #ffc107;
      color: #856404;
      padding: 12px 15px;
      border-radius: 4px;
      font-size: 14px;
      margin: 20px 0;
      text-align: center;
    }
    .security-note {
      background-color: #e8f4f8;
      border-left: 4px solid #17a2b8;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
      font-size: 13px;
      color: #0c5460;
    }
    .security-note strong {
      display: block;
      margin-bottom: 5px;
    }
    .footer {
      background-color: #f5f5f5;
      padding: 20px 30px;
      text-align: center;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #999;
    }
    .footer p {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${appName}</h1>
    </div>
    
    <div class="content">
      <div class="greeting">
        👋 Hello!
      </div>
      
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      
      <div class="reset-section">
        <a href="${resetLink}" class="reset-button">🔐 Reset Password</a>
        <div class="link-text">
          Or copy and paste this link in your browser:
          <span>${resetLink}</span>
        </div>
      </div>
      
      <div class="expiry-info">
        ⏱️ This link expires in <strong>1 hour</strong>
      </div>
    </div>
    
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `,
};
