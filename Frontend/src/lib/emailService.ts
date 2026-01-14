// Email Service API utilities
const EMAIL_SERVICE_URL = process.env.NEXT_PUBLIC_EMAIL_SERVICE_URL || 'http://localhost:3001';

export const emailService = {
  // Generate and send OTP (for new users/unverified users)
  async generateAndSendOTP(email: string) {
    try {
      const response = await fetch(`${EMAIL_SERVICE_URL}/generate-send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      return data;
    } catch (error) {
      console.error('Email service error:', error);
      throw error;
    }
  },

  // Send OTP with provided code
  async sendOTP(email: string, otp: string) {
    try {
      const response = await fetch(`${EMAIL_SERVICE_URL}/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      return data;
    } catch (error) {
      console.error('Email service error:', error);
      throw error;
    }
  },

  // Generate and send password reset email
  async generateAndSendPasswordReset(email: string) {
    try {
      const response = await fetch(`${EMAIL_SERVICE_URL}/generate-send-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send password reset email');
      }

      return data;
    } catch (error) {
      console.error('Email service error:', error);
      throw error;
    }
  },

  // Send password reset email with provided link
  async sendPasswordReset(email: string, resetLink: string) {
    try {
      const response = await fetch(`${EMAIL_SERVICE_URL}/send-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, resetLink }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send password reset email');
      }

      return data;
    } catch (error) {
      console.error('Email service error:', error);
      throw error;
    }
  },

  // Send welcome email
  async sendWelcomeEmail(to: string, userName: string) {
    try {
      const response = await fetch(`${EMAIL_SERVICE_URL}/send-welcome`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to, userName }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send welcome email');
      }

      return data;
    } catch (error) {
      console.error('Email service error:', error);
      throw error;
    }
  },

  // Generic send email
  async sendEmail(to: string, subject: string, text?: string, html?: string) {
    try {
      const response = await fetch(`${EMAIL_SERVICE_URL}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to, subject, text, html }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      return data;
    } catch (error) {
      console.error('Email service error:', error);
      throw error;
    }
  },
};
