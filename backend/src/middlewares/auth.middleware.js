import User from "../models/auth/userAuth.model.js";
import jwt from "jsonwebtoken";

// protected routes middleware
const protectedRoutes = async (req, res, next) => {
  try {
    // Get token from cookies OR Authorization header
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    // If token missing
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    // Verify token
    const decodedToken = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );

    // Find user
    const user = await User.findById(decodedToken._id)
      .select("-password -refreshToken");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: user not found",
      });
    }

    //  Email verification check
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email to proceed",
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;

    // Move to next middleware/controller
    next();

  } catch (error) {
    console.error("JWT Error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired access token",
    });
  }
};

// middleware for verfyOtp
const otpValidation = async (req, res, next) => {
  try {
    // take token from cookies or header
    const token =
       req.cookies?.otpToken ||
      req.header("Authorization")?.replace("Bearer ", "");

      // check token is comming or not
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access !!!",
      });
    }

    //decoded the token with jwt
    const decodedToken = jwt.verify(token, process.env.OTP_TOKEN_SECRET);

    // find user with decoded token
    const user = await User.findById(decodedToken._id || decodedToken.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not found",
      });
    }

    // add user in request objsct
    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    console.error("OTP token error:", error.message);
    const message =
      error.name === "TokenExpiredError"
        ? "OTP token has expired"
        : error.name === "JsonWebTokenError"
        ? "Invalid OTP token"
        : error.message;
    return res.status(401).json({ success: false, message });
  }
};


export { protectedRoutes,otpValidation };
