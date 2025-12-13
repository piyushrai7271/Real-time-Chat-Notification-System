import express from "express";
import {
  protectedRoutes,
  otpValidation,
} from "../../middlewares/auth.middleware.js";
import { uploadImage } from "../../config/cloudinary.js";
import {
  register,
  verifyOtp,
  resendOtp,
  login,
  changePassword,
  forgetPassword,
  resetPassword,
  addProfileDetails,
  updateUserDetails,
  getUserDetail,
  getAllUserDetails,
  logOut,
} from "../../controllers/auth/userAuth.controller.js";
const router = express.Router();

router.post("/register", register);
router.post("/verify-otp", otpValidation, verifyOtp);
router.post("/resend-otp", otpValidation, resendOtp);
router.post("/login", login);

router.post("/forget-password", forgetPassword);
router.post("/reset-password", resetPassword);

// Protected routes
router.post("/change-password", protectedRoutes, changePassword);
router.post(
  "/add-profile-details",
  protectedRoutes,
  uploadImage.single("profileImage"),
  addProfileDetails
);
router.put(
  "/update-user-details",
  protectedRoutes,
  uploadImage.single("profileImage"),
  updateUserDetails
);
router.get("/get-user-details", protectedRoutes, getUserDetail);
router.get("/get-alluser-details", protectedRoutes, getAllUserDetails);
router.post("/logout", protectedRoutes, logOut);

export default router;
