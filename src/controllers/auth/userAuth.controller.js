import User from "../../models/auth/userAuth.model.js";
import sendOtpVerifyEmail from "../../utils/auth/verifyOtp.email.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new Error("Error in generating access and refresh token ");
  }
};
const register = async (req, res) => {
  try {
    // take detailes for register user
    const { fullName, email, mobileNumber, password } = req.body;

    // validate details that comming or not
    if (!fullName || !email || !mobileNumber || !password) {
      return res.status(404).json({
        success: false,
        message: "Please provide all the details for signup !!",
      });
    }

    // Add validation for email and mobile number formating
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(422).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Validate mobile number format
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(mobileNumber)) {
      return res.status(422).json({
        success: false,
        message: "Mobile number must be exactly 10 digits",
      });
    }

    // Validate password strength
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(422).json({
        success: false,
        message:"Password must be at least 8 chars long"
      });
    }

    // find user with email, if user already exist give error
    const existingUser = await User.findOne({email});
    if(existingUser){
        return res.status(400).json({
            success:false,
            message:"User already exist with this email !!"
        })
    }
    // if no user found create new user
    const user = new User({
        fullName,
        email,
        mobileNumber,
        password
    })
    //save data in db
    await user.save()

    // Send OTP email
    const otpResult = await sendOtpVerifyEmail(user);
    if (!otpResult.success) {
      return res.status(500).json({
        success: false,
        message: "User created but failed to send OTP",
      });
    }

    // Generate OTP token
    const otpToken = user.generateOtpToken();
    if (!otpToken) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate OTP token",
      });
    }
    // return success response
    return res.status(201).json({
        success:true,
        message:"User registered successfully !!",
        user:{
            id:user._id,
            fullName:user.fullName,
            email:user.email,
            mobileNumber: user.mobileNumber,
            isVerified : user.isVerified
        }
    })
  } catch (error) {
    console.error("Error in regester user :",error);
    return res.status(500).json({
        success:false,
        message:"Internal server error !!"
    })
  }
};
const verifyOtp = async (req, res) => {
    try {
        // take otp from body and userId frommiddleware
        const {otp} = req.body;
        const userId = req.userId;
        
        // validate otp is comming or not
        if(!otp){
            return res.status(400).json({
                success:false,
                message:"Otp is required"
            })
        }

        // validate userId is comming or not
        if(!userId){
            return res.status(401).json({
                success:false,
                message:"Unauthorized : missing user information"
            })
        }

        //find user & validate OTP existence
        const user = await User.findById(userId);
        if(!user || !user.otp || !user.otpExpiresAt){
            return res.status(400).json({
                success:false,
                message: "Invalid or expired OTP request"
            })
        }

        // check OTP expiration
        if (Date.now() > new Date(user.otpExpiresAt).getTime()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

      // Verify OTP correctness
    const isOtpCorrect = await user.isOtpCorrect(otp);
    if (!isOtpCorrect) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Mark user as verified & clear OTP fields
    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();

    // Send success response
    return res.status(200).json({
      success: true,
      message: "OTP verified successfully. You can now log in.",
    });
    } catch (error) {
        console.error("Error in verify otp :",error.message);
        return res.status(500).json({
            success:false,
            message:"Internal server error !!"
        })
    }
};
const resendOtp = async (req, res) => {
    try {
        
    } catch (error) {
        
    }
};
const login = async (req, res) => {};
const changePassword = async (req, res) => {};
const forgetPassword = async (req, res) => {};
const resetPassword = async (req, res) => {};
const addProfileDetails = async (req, res) => {};
const updateUserDetails = async (req, res) => {};
const getUserDetail = async (req, res) => {};
const getAllUserDetails = async (req, res) => {};
const logOut = async (req, res) => {};

export {
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
};
