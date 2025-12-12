import User from "../models/auth/userAuth.model.js";
import jwt from "jsonwebtoken";

const protectedRoutes = async (req, res, next) => {
  try {
    // take token from cookies or header
    const token =
      (await req.cookies?.accessToken) ||
      req.header("Authorization").replace("Bearer ", "");

    // check token is comming or not
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access !!!",
      });
    }

    // decoded and verify jwt token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // check decodedToken are get or not
    if (!decodedToken) {
      return res.status(404).json({
        success: false,
        message: "Can't find decoded token",
      });
    }

    // find user with decoded token
    const user = await User.findById(decodedToken._id || decodedToken.id).select(
      "-password -refreshToken"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: user not found",
      });
    }
    // Ensure user has verified their email
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email to proceed",
      });
    }

    // add user in request object
    req.use = user;
    req.userId = user._id;
  } catch (error) {
    console.error("Error in access token :", error.message);
    return res.status(401).json({
        success:false,
        message:"Access token is missing or expired !!"
    })
  }
};

const otpValidation = async (req, res, next) => {
  try {
    // take token from cookies or header
    const token =
      (await req.cookies?.accessToken) ||
      req.header("Authorization").replace("Bearer ", "");

      // check token is comming or not
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access !!!",
      });
    }

    //decoded the token with jwt
    const decodedToken = jwt.verify(token, process.env.OTP_TOKEN_SECRET);

    // check decodedToken are get or not
    if (!decodedToken) {
      return res.status(404).json({
        success: false,
        message: "Can't find decoded token",
      });
    }

    // find user with decoded token
    const user = await UserToken.findById(decodedToken._id || decodedToken.id);
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
