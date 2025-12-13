export const resetPasswordEmailHTML = (displayName, resetLink) => `
  <div style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 30px;">
    <div style="
      max-width: 600px;
      margin: auto;
      background: #ffffff;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 6px 18px rgba(0,0,0,0.15);
    ">
      
      <!-- Header -->
      <h1 style="text-align: center; color: #007bff; margin: 0; font-size: 28px; font-weight: 700;">
        NodeBoilerPlate
      </h1>
      <h2 style="text-align: center; color: #333; margin-top: 10px; font-size: 20px; font-weight: 500;">
        Reset Your Password
      </h2>
      
      <!-- Greeting -->
      <p style="font-size: 16px; color: #444; line-height: 1.5;">
        Hello <strong>${displayName}</strong>,
      </p>
      <p style="font-size: 16px; color: #444; line-height: 1.5;">
        We received a request to reset your password. Click the button below to reset it:
      </p>
      
      <!-- Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" target="_blank" style="
          display: inline-block;
          padding: 14px 28px;
          background: linear-gradient(90deg, #28a745, #34d058);
          color: #ffffff;
          text-decoration: none;
          font-size: 16px;
          font-weight: bold;
          border-radius: 6px;
          box-shadow: 0 4px 10px rgba(40, 167, 69, 0.3);
        ">
          Reset Your Password
        </a>
      </div>
      
      <!-- Expiry Notice -->
      <p style="font-size: 14px; color: #666; line-height: 1.5;">
        This link will expire in <strong>1 hour</strong>. If you didn’t request this, you can safely ignore this email.
      </p>
      
      <!-- Footer -->
      <p style="font-size: 14px; color: #999; margin-top: 30px; text-align: center;">
        Thanks,<br/>The NodeBoilerPlate Team
      </p>
      
    </div>
  </div>
`;


export const resetPasswordEmailText = (displayName, resetLink) => `
Hello ${displayName},

We received a request to reset your password. Use the link below to do so:

${resetLink}

This link will expire in 1 hour. If you didn’t request this, you can safely ignore this email.

Thanks,
The Chatiffy Team
`;