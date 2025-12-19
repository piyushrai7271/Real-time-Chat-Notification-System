import nodemailer from "nodemailer";
import otpVerificationTemplate from "./verifyOtpEmail.templete.js";

const sendOtpVerifyEmail = async (user) => {
  try {
    // Configure Nodemailer transport
    const transport = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP to user (hashed in pre-save hook)
    user.otp = otp;
    user.otpExpiresAt = Date.now() + 15 * 60 * 1000; // expires in 15 minutes
    await user.save();

    // Prepare email using updated company name
    const mailOptions = {
      from: `"Real-Time-Chat" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "OTP for Account Verification",
      html: otpVerificationTemplate(user, otp),
    };

    // Send email
    await transport.sendMail(mailOptions);

    return {
      success: true,
      message: "OTP email sent successfully.",
      otp, // ⚠️ Remove in production
    };
  } catch (error) {
    console.error("❌ Error sending OTP email:", error);
    return {
      success: false,
      message: "Failed to send OTP email.",
    };
  }
};

export default sendOtpVerifyEmail;
