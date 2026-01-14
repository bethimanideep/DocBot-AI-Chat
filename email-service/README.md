# Email Service

A dedicated email service backend using nodemailer for DocBot AI Chat.

## Features

- Send transactional emails
- Welcome emails
- Password reset emails
- Health check endpoint
- CORS enabled for cross-origin requests

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
PORT=3001
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
FRONTEND_URL=http://localhost:3000
```

## API Endpoints

### Health Check
- `GET /health` - Check if service is running

### OTP Endpoints
- `POST /send-otp` - Send OTP with provided code
  ```json
  {
    "email": "user@example.com",
    "otp": "123456"
  }
  ```

- `POST /generate-send-otp` - Generate and send OTP (returns OTP for backend storage)
  ```json
  {
    "email": "user@example.com"
  }
  ```

### Password Reset Endpoints
- `POST /send-password-reset` - Send password reset with provided link
  ```json
  {
    "email": "user@example.com",
    "resetLink": "https://yourapp.com/reset?token=abc123"
  }
  ```

- `POST /generate-send-password-reset` - Generate token and send password reset email
  ```json
  {
    "email": "user@example.com"
  }
  ```

### Send Email
- `POST /send-email`
  ```json
  {
    "to": "recipient@example.com",
    "subject": "Email Subject",
    "text": "Plain text content",
    "html": "<h1>HTML content</h1>"
  }
  ```

### Send Welcome Email
- `POST /send-welcome`
  ```json
  {
    "to": "user@example.com",
    "userName": "John Doe"
  }
  ```

## Usage

Start the service:

```bash
npm start
```

For development:

```bash
npm run dev
```

## Deployment

This service is designed to be deployed separately from the main application for better performance and scaling.
