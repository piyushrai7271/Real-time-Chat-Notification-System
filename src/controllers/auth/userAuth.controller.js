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

    // Add validation for email and mobile number formating and password strength
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
        message: "Password must be at least 8 chars long",
      });
    }

    // find user with email, if user already exist given email than give error
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exist with this email !!",
      });
    }
    // if no user found create new user
    const user = new User({
      fullName,
      email,
      mobileNumber,
      password, //password hashed in model with pre hook
    });
    //save data in db
    await user.save();

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
      success: true,
      message: "User registered successfully !!",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobileNumber: user.mobileNumber,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Error in regester user :", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error !!",
    });
  }
};
const verifyOtp = async (req, res) => {
  try {
    // take otp from body and userId frommiddleware
    const { otp } = req.body;
    const userId = req.userId;

    // validate otp is comming or not
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "Otp is required",
      });
    }

    // validate userId is comming or not
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized : missing user information",
      });
    }

    //find user & validate OTP existence
    const user = await User.findById(userId);
    if (!user || !user.otp || !user.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP request",
      });
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
    console.error("Error in verify otp :", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error !!",
    });
  }
};
const resendOtp = async (req, res) => {
  try {
    // take user id from middleware
    const userId = req.userId;

    // validate userid
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized : user id is missing !!",
      });
    }
    // find user with user id if not found provide error
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with user id",
      });
    }
    // if user found than call the function for sending otp email
    // Send OTP email
    const otpResult = await sendOtpVerifyEmail(user);
    if (!otpResult.success) {
      return res.status(500).json({
        success: false,
        message: "User created but failed to send OTP",
      });
    }

    // success response
    return res.status(200).json({
      success:false,
      message:"Error in resending otp !!"
    })
  } catch (error) {
    console.error("Error in resending otp :", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error in resending otp",
    });
  }
};
const login = async (req, res) => {
  try {
    //take login input from body
    const {email,password} = req.body;

    //check if email or password is comming or not
    if(!email || !password){
        return res.status(404).json({
          success:false,
          message:"Please provide all the details for login !!"
        })
    }

    // find user with email and if user not found give error
    const user = await User.findOne({email})
    if(!user){
      return res.status(404).json({
        success:false,
        message:"User not found !!"
      })
    }

    // check user email is verified or not
    if(!user.isVerified){
      return res.status(404).json({
        success:false,
        message:"Please register user first than login !"
      })
    }

    // if user is found than comapir password
    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid){
      return res.status(401).json({
        success:false,
        message:"Please provide valid password"
      })
    }
    
    // if every thing good than gererate access and refresh token
    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id);

    // generate cookie options and pass access and refresh token in cookie
    let isProduction = process.env.NODE_ENV === "production";
    const accessTokenOptions = {
        httpOnly:true,
        secure:isProduction,
        sameSite:isProduction ? "none" : "lax",
        maxAge: 5 * 60 * 1000,
    }

    const refreshTokenOptions = {
        httpOnly:true,
        secure:isProduction,
        sameSite:isProduction ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
    }
    // send success response
    return res
        .status(200)
        .cookie("accessToken",accessToken,accessTokenOptions)
        .cookie("refreshToken",refreshToken,refreshTokenOptions)
        .json({
          success:true,
          message:"User Loged in successfully !!"
        })
  } catch (error) {
    console.error("Error in login user :", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error !!",
    });
  }
};
const changePassword = async (req, res) => {
  try {
    //take input for changing password
    const {currentPassword,newPassword,confirmPassword} = req.body;
    const userId = req.userId;

    // validate userId
    if(!userId){
      return res.status(404).json({
        success:false,
        message:"user id is missing"
      })
    }
    //validate comming input
    if(!currentPassword || !newPassword || !confirmPassword){
      return res.status(404).json({
        success:false,
        message:"Please provide all the details for changing password"
      })
    }

    // if newPassword is not equal to confirmPassword give error
    if(newPassword !== confirmPassword){
      return res.status(400).json({
          success:false,
          message:"New password and confirm Password is not matching"
      })
    }

    //find user with user id
    const user = await User.findById(userId);
    if(!user){
      return res.status(404).json({
        success:false,
        message:"User not found with user id"
      })
    }

    // check current password is correct or not
    const isPasswordValid = await user.isPasswordCorrect(currentPassword);
    if(!isPasswordValid){
      return res.status(401).json({
        success:false,
        message:"Current Password is not correct "
      })
    }

    // if password is correct update the password with new password
    user.password = newPassword;
    await user.save({validateBeforeSave:false})
    
    //send success response
    return res.status(200).json({
      success:true,
      message:"Password changed successfully !!"
    })
  } catch (error) {
    console.error("Error in changing password :",error.message);
    return res.status(500).json({
      success:false,
      message:"Internal server error in change password "
    })
  }
};
const forgetPassword = async (req, res) => {
  try {
    // 
  } catch (error) {
    console.error("Error in forget Password :",error.message);
    return res.status(500).json({
      success:false,
      message:"Internal server error !!"
    })
  }
};
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
