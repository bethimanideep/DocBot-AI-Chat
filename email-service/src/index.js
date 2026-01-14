const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const { emailTemplates } = require('./emailTemplates');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Email service is running', timestamp: new Date().toISOString() });
});

// Send OTP endpoint (copied from backend logic)
app.post('/send-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Your OTP Code - DocBot AI",
      html: emailTemplates.otp(otp, "DocBot AI"),
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`OTP sent to ${email}: ${info.messageId}`);
    res.json({ 
      success: true, 
      messageId: info.messageId,
      message: 'OTP sent successfully' 
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ 
      error: 'Failed to send OTP',
      details: error.message 
    });
  }
});

// Generate and send OTP endpoint (for new users/unverified users)
app.post('/generate-send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Your OTP Code - DocBot AI",
      html: emailTemplates.otp(otp, "DocBot AI"),
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`Generated and sent OTP to ${email}: ${info.messageId}`);
    res.json({ 
      success: true, 
      otp: otp, // Return OTP for backend to store
      messageId: info.messageId,
      message: 'OTP generated and sent successfully',
      expiresAt: new Date(Date.now() + 10 * 60000).toISOString() // 10 minutes expiry
    });
  } catch (error) {
    console.error('Error generating and sending OTP:', error);
    res.status(500).json({ 
      error: 'Failed to generate and send OTP',
      details: error.message 
    });
  }
});

// Send password reset email endpoint
app.post('/send-password-reset', async (req, res) => {
  try {
    const { email, resetLink } = req.body;

    if (!email || !resetLink) {
      return res.status(400).json({ error: 'Email and reset link are required' });
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Reset Your Password - DocBot AI",
      html: emailTemplates.passwordReset(resetLink, "DocBot AI"),
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`Password reset email sent to ${email}: ${info.messageId}`);
    res.json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Password reset email sent successfully' 
    });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    res.status(500).json({ 
      error: 'Failed to send password reset email',
      details: error.message 
    });
  }
});

// Generate reset token and send email endpoint
app.post('/generate-send-password-reset', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Generate secure reset token
    const token = crypto.randomBytes(32).toString("hex");
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Reset Your Password - DocBot AI",
      html: emailTemplates.passwordReset(resetLink, "DocBot AI"),
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`Generated and sent password reset email to ${email}: ${info.messageId}`);
    res.json({ 
      success: true, 
      token: token, // Return token for backend to store
      resetLink: resetLink,
      messageId: info.messageId,
      message: 'Password reset email sent successfully',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour expiry
    });
  } catch (error) {
    console.error('Error generating and sending password reset email:', error);
    res.status(500).json({ 
      error: 'Failed to generate and send password reset email',
      details: error.message 
    });
  }
});

// Send welcome email endpoint
app.post('/send-welcome', async (req, res) => {
  try {
    const { to, userName } = req.body;

    if (!to || !userName) {
      return res.status(400).json({ error: 'Email and user name are required' });
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to DocBot AI Chat!</h2>
        <p>Hello ${userName},</p>
        <p>Thank you for joining DocBot AI Chat. We're excited to have you on board!</p>
        <p>With DocBot AI Chat, you can:</p>
        <ul>
          <li>Upload and process various document formats</li>
          <li>Ask questions about your documents in natural language</li>
          <li>Get intelligent responses powered by AI</li>
          <li>Organize and manage your documents efficiently</li>
        </ul>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Best regards,<br/>The DocBot AI Chat Team</p>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject: 'Welcome to DocBot AI Chat!',
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Welcome email sent: ', info.messageId);
    res.json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Welcome email sent successfully' 
    });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    res.status(500).json({ 
      error: 'Failed to send welcome email',
      details: error.message 
    });
  }
});

// Send email endpoint (generic)
app.post('/send-email', async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;

    if (!to || !subject) {
      return res.status(400).json({ error: 'To email and subject are required' });
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text: text || '',
      html: html || text || '',
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent: ', info.messageId);
    res.json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Email sent successfully' 
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      error: 'Failed to send email',
      details: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Email service running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});
