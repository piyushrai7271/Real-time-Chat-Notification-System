// -----------------------------------------------------------------------------
// 🔐 OTP Rate Limiter Middleware
// -----------------------------------------------------------------------------
// This middleware protects against brute-force OTP attacks from the same IP.
// It limits OTP verification and resend attempts to a maximum number within
// a time window (default: 10 requests per 15 minutes).
// -----------------------------------------------------------------------------

import rateLimit from "express-rate-limit";

export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // ⏰ 15-minute window
  max: 10, // 🚫 Maximum 10 OTP-related requests per IP per window
  standardHeaders: true, // ✅ Return helpful rate-limit headers (RateLimit-*)
  legacyHeaders: false, // ❌ Disable legacy headers
  message: {
    success: false,
    message:
      "Too many OTP verification attempts from this IP. Please try again after 15 minutes.",
  },
  skipSuccessfulRequests: false, // 🔄 Count all requests (successful and failed)
});
