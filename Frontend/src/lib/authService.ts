// Authentication service that coordinates between backend and email service
import { emailService } from './emailService';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export const authService = {
  // Login with email and password - handles OTP generation via email service
  async login(email: string, password: string) {
    try {
      // First, try to login via backend
      const response = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // If backend returns OTP sent message, we need to generate OTP via email service
        if (data.message === "OTP sent to your email") {
          try {
            // Generate OTP via email service
            const otpData = await emailService.generateAndSendOTP(email);
            
            // Store OTP in backend
            await fetch(`${BACKEND_URL}/auth/store-otp`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                email, 
                otp: otpData.otp,
                expiresAt: otpData.expiresAt 
              }),
            });
            
            return { ...data, otpSent: true, otpData };
          } catch (otpError) {
            console.error('OTP generation failed:', otpError);
            throw new Error('Failed to generate OTP. Please try again.');
          }
        }
        
        return data;
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Verify OTP
  async verifyOTP(email: string, otp: string) {
    try {
      const response = await fetch(`${BACKEND_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'OTP verification failed');
      }

      return data;
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    }
  },

  // Forgot password - generates reset token via email service
  async forgotPassword(email: string) {
    try {
      // Generate reset token via email service
      const resetData = await emailService.generateAndSendPasswordReset(email);
      
      // Store token in backend
      await fetch(`${BACKEND_URL}/auth/store-reset-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          token: resetData.token,
          resetLink: resetData.resetLink 
        }),
      });

      return {
        message: "If an account exists, a reset link was sent.",
        resetData
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },

  // Reset password
  async resetPassword(token: string, password: string) {
    try {
      const response = await fetch(`${BACKEND_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Password reset failed');
      }

      return data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },
};
