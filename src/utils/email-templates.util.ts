const emailLayout = (title: string, content: string) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .header {
          background-color: #2a9d8f;
          color: #ffffff;
          padding: 24px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .content {
          padding: 32px;
          color: #333333;
          line-height: 1.6;
        }
        .content p {
          margin: 0 0 16px;
        }
        .otp-code {
          display: inline-block;
          background-color: #e9ecef;
          color: #264653;
          font-size: 20px;
          font-weight: 700;
          padding: 12px 20px;
          border-radius: 6px;
          letter-spacing: 2px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          padding: 24px;
          font-size: 14px;
          color: #888888;
        }
        .footer p {
          margin: 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Islamic Web. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const getVerificationEmailTemplate = (otp: string) => {
  const title = 'Verify Your Email Address';
  const content = `
    <p>Thank you for registering with Islamic Web. Please use the following One-Time Password (OTP) to verify your email address:</p>
    <div align="center">
      <span class="otp-code">${otp}</span>
    </div>
    <p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
  `;
  return emailLayout(title, content);
};

export const getWelcomeEmailTemplate = (username: string) => {
  const title = 'Welcome to Islamic Web!';
  const content = `
    <p>Hello ${username},</p>
    <p>Thank you for verifying your email. We are excited to have you on board. You can now explore all the features our platform has to offer.</p>
    <p>Best regards,<br>The Islamic Web Team</p>
  `;
  return emailLayout(title, content);
};

export const getForgotPasswordEmailTemplate = (otp: string) => {
  const title = 'Reset Your Password';
  const content = `
    <p>We received a request to reset your password. Use the code below to proceed:</p>
    <div align="center">
      <span class="otp-code">${otp}</span>
    </div>
    <p>This code will expire in 10 minutes. If you did not make this request, you can safely ignore this email.</p>
  `;
  return emailLayout(title, content);
};
