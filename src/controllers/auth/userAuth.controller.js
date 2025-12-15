import jwt from "jsonwebtoken";
import User from "../../models/auth/userAuth.model.js";
import resetPasswordLink from "../../utils/auth/resetPassword.email.js";
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
      otpToken
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
    const user = req.user;

    // validate userid
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized : user id is missing !!",
      });
    }

    // check if user already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified",
      });
    }
    // if user found than call the function for sending otp email
    // Send OTP email
    const response = await sendOtpVerifyEmail(user);
    if (response.success) {
      return res.status(200).json({
        success: true,
        message: "Otp resent successfully",
      });
    }

    // success response
    return res.status(500).json({
      success: false,
      message: "Failed to resend OTP. Please try again later",
    });
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
    const { email, password } = req.body;

    //check if email or password is comming or not
    if (!email || !password) {
      return res.status(404).json({
        success: false,
        message: "Please provide all the details for login !!",
      });
    }

    // find user with email and if user not found give error
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with email ",
      });
    }

    // check user email is verified or not
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please register user first than login !",
      });
    }

    // if user is found than comapir password
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Please provide valid password",
      });
    }

    // if every thing good than gererate access and refresh token
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

      user.refreshToken = refreshToken;
      await user.save({validateBeforeSave:false});

    // Remove sensitive data
    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken -otp -otpExpiresAt"
    );

    // generate cookie options and pass access and refresh token in cookie
    let isProduction = process.env.NODE_ENV === "production";
    const accessTokenOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 5 * 60 * 1000,
    };

    const refreshTokenOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
    // send success response
    return res
      .status(200)
      .cookie("accessToken", accessToken, accessTokenOptions)
      .cookie("refreshToken", refreshToken, refreshTokenOptions)
      .json({
        success: true,
        message: "User Loged in successfully !!",
        user: loggedInUser,
        accessToken
      });
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
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.userId;

    // validate userId
    if (!userId) {
      return res.status(404).json({
        success: false,
        message: "user id is missing",
      });
    }
    //validate comming input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide all the details for changing password",
      });
    }

    // if newPassword is not equal to confirmPassword give error
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm Password is not matching",
      });
    }

    //find user with user id
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with user id",
      });
    }

    // check current password is correct or not
    const isPasswordValid = await user.isPasswordCorrect(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current Password is not correct ",
      });
    }

    // if password is correct update the password with new password
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    //send success response
    return res.status(200).json({
      success: true,
      message: "Password changed successfully !!",
    });
  } catch (error) {
    console.error("Error in changing password :", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error in change password ",
    });
  }
};
const forgetPassword = async (req, res) => {
  try {
    // please provide regestered email
    const { email } = req.body;

    // validate email comming
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid registered email ",
      });
    }

    //find user with email
    const user = await User.findOne({ email });

    // if user not found give error
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with the email",
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before resetting password !!",
      });
    }
    // Send reset link on email
    const result = await resetPasswordLink(user);

    // Check if email sending was successful
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to send reset password link. Pleas try again later",
      });
    }

    // send success response
    return res.status(200).json({
      success: true,
      message: "Reset password link sent to your regestered link",
    });
  } catch (error) {
    console.error("Error in forget Password :", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error !!",
    });
  }
};
const resetPassword = async (req, res) => {
  try {
    // take currentPassword, newPassword, confirmPassword
    const { newPassword, confirmPassword } = req.body;
    const { token } = req.params;

    // validate comming input
    if (!newPassword || !confirmPassword) {
      return res.status(404).json({
        success: false,
        message: "Please provide all the details for changing password",
      });
    }

    // Validate comming token
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is missing !!",
      });
    }

    // Validate password format
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.",
      });
    }

    // Comparing newPassword and confirmPassword
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "newPassword and confirmPassword is not matching ",
      });
    }

    // Verify token
    let Payload;
    try {
      Payload = jwt.verify(token, process.env.RESET_PASSWORD_SECRET);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // find user by token payload
    const user = await User.findById(Payload.id || Payload._id);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    //update and password with new password
    user.password = newPassword;
    await user.save();

    //Return Success response
    return res.status(200).json({
      success: true,
      message: "Password changed successfully, now you can login",
    });
  } catch (error) {
    console.error("Error in resetting password :", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error !!",
    });
  }
};
const addProfileDetails = async (req, res) => {
  try {
    const { gender, about } = req.body;
    const profileImage = req.file?.path;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    if (!gender || !about) {
      return res.status(400).json({
        success: false,
        message: "Gender or about is missing",
      });
    }

    if (!["Male", "Female", "Other"].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: "Invalid gender value",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.gender = gender;
    user.about = about;
    if (profileImage) {
      user.profileImage = profileImage;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile details added successfully",
    });
  } catch (error) {
    console.error("Error in addProfileDetails:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
const updateUserDetails = async (req, res) => {
  try {
    const userId = req.userId; // coming from auth middleware
    const { fullName, about, gender } = req.body;
    const profileImage = req.file?.path; // cloudinary image URL

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    // find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // update only provided fields
    if (fullName) user.fullName = fullName;
    if (about) user.about = about;

    if (gender) {
      if (!["Male", "Female", "Other"].includes(gender)) {
        return res.status(400).json({
          success: false,
          message: "Invalid gender value",
        });
      }
      user.gender = gender;
    }

    // update profile image if uploaded
    if (profileImage) {
      user.profileImage = profileImage;
    }

    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: "User details updated successfully",
      user: {
        fullName: user.fullName,
        email: user.email,
        gender: user.gender,
        about: user.about,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error("Error in updateUserDetails:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
const getUserDetail = async (req, res) => {
  try {
    // Extract userid from middleware
    const userId = req.userId;

    // Validate that userId is present
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: user Id is missing from request",
      });
    }

    // fetch user details (exclude sensitive field)
    const user = await User.findById(userId)
      .select("-password -otp -refreshToken -otpExpiresAt")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with provided ID",
      });
    }

    // return success response
    return res.status(200).json({
      success: true,
      message: "User details fetched successfully",
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobileNumber: user.mobileNumber,
        gender: user.gender,
        about: user.about,
        isVerified: user.isVerified,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error("Error in fetching user details");
    return res.status(500).json({
      success: false,
      message: "Internal server error !!",
    });
  }
};
const getAllUserDetails = async (req, res) => {
  try {
    // Pagination params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Total user count excluding
    const totalUser = await User.countDocuments({ isVerified: true });

    // fetch paginated user
    const users = await User.find({ isVerified: true })
      .select("-password -otp -refreshToken -otpExpiresAt")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      pagination: {
        totalUser,
        currentPage: page,
        totalPage: Math.ceil(totalUser / limit),
        pageSize: limit,
      },
      data: users,
    });
  } catch (error) {
    console.error("Error while fetching all users: ", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error ",
    });
  }
};
const refreshAccessToken = async(req,res) =>{

  const incmingRefreshToken =
  req.cookies?.refreshToken || req.body.refreshToken;

  if(!incmingRefreshToken){
    return res.status(404).json({
      success:false,
      message:"Unauthorized access"
    })
  }

  try {
    const decodedToken = jwt.verify(
      incmingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

     if(!decodedToken){
      return res.status(402).json({
        success:false,
        message:"decoded token is not comming"
      })
     }

     const user = await User.findById(decodedToken._id);

     if(!user){
      return res.status(404).json({
        success:false,
        message:"Invalid refreshToken"
      })
     }

     if(incmingRefreshToken !== user.refreshToken){
      return res.status(405).json({
        success:false,
        message:"RefreshToken is expired or used"
      })
     }

     const {accessToken,refreshToken} = generateAccessAndRefreshToken(user._id);

     user.refreshToken = refreshToken;
     await user.save({validateBeforeSave:false});

     // generate cookie options and pass access and refresh token in cookie
    let isProduction = process.env.NODE_ENV === "production";
    const accessTokenOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 5 * 60 * 1000,
    };

    const refreshTokenOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
 
    return res
        .status(200)
        .cookie("accessToken",accessToken,accessTokenOptions)
        .cookie("refreshToken",refreshToken,refreshTokenOptions)
        .json({
          success:true,
          message:"Token is refreshed successfully !!",
          accessToken,
          refreshToken
        })
  } catch (error) {
    console.error("Error in refreshing token :",error.message);
    return res.status(500).json({
      success:false,
      message:"Internal server error in refreshing token"
    })
  }
}
const logOut = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: user id is missing !!",
      });
    }

    // find and clear refreshToken
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found !!",
      });
    }

    user.refreshToken = null;
    await user.save({ validateBeforeSave: false });

    let isProduction = process.env.NODE_ENV === "production";
    const accessTokenOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 5 * 60 * 1000,
    };

    const refreshTokenOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    return res
      .status(200)
      .clearCookie("accessToken", accessTokenOptions)
      .clearCookie("refreshToekn", refreshTokenOptions)
      .json({
        success: true,
        message: "User logged out successfully !!",
      });
  } catch (error) {
    console.error("Error in logOut :", error);
    return res.status(500).json({
      success: false,
      message: "Internal sserver error !!",
    });
  }
};

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
  refreshAccessToken,
  logOut,
};
