import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
        "Please enter a valid email address",
      ],
    },
    mobileNumber: {
      type: String,
      unique: true,
      trim: true,
      match: [/^\d{10}$/, "Please enter a valid 10-digit phone number"],
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      trim: true,
    },
    about: {
      type: String, // small details about user
      trim: true,
    },
    profileImage: {
      type: String, //url from cloudinary for image
      trim: true,
    },
    password: {
      type: String,
    },
    isVerified: {
      type: Boolean, // Email verification
      default: false,
    },
    otp: {
      type: String,
    },
    otpExpiresAt: {
      type: Date,
    },
    otpAttemptCount:{
      type:Number,
      default:0,// Track wrong OTP attempts
    },
    otpBlockedUntil:{
      type:Date,
      default:null // if set, user is blocked from verifying OTP
    },
    lastOtpSentAt:{
      type:Date,
      default:null // Track when the OTP was sent (for resent cooldown)
    },
    refreshToken: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Hash password and otp before saving
userSchema.pre("save", async function () {
  //hashing password
  if (this.isModified("password") && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }

  // hashing otp
  if (this.isModified("otp") && this.otp && !this.otp.startsWith("$2b$")) {
    this.otp = await bcrypt.hash(this.otp.toString(), 8);
  }
});

// compare password
userSchema.methods.isPasswordCorrect = async function (inputPassword) {
  return await bcrypt.compare(inputPassword.toString(), this.password);
};

//  Compare OTP
userSchema.methods.isOtpCorrect = async function (plainOtp) {
  return await bcrypt.compare(plainOtp.toString(), this.otp);
};

// Generate Access Token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      fullName: this.fullName,
      email: this.email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

// Generate refresh Token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

// Generate Otp token for verifying otp
userSchema.methods.generateOtpToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.OTP_TOKEN_SECRET,
    {
      expiresIn: process.env.OTP_TOKEN_EXPIRY,
    }
  );
};

const User = mongoose.model("User", userSchema);
export default User;
