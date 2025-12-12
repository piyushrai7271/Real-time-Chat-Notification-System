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

export { protectedRoutes };
