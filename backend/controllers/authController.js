import jwt from "jsonwebtoken";
import User from "../models/User.js";
import sendOTP from "../utils/sendOTP.js";

const generateToken = (userId, role, rememberMe = false) => {
  return jwt.sign(
    {
      id: userId,
      role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: rememberMe ? process.env.JWT_EXPIRE : "1d",
    },
  );
};

//====== Admin Login ======

export const adminLogin = async (req, res) => {
  try {
    const { mobile, password, rememberMe } = req.body;
    if (!mobile || !password) {
      return res.status(400).json({
        success: false,
        message: "Mobile and password are required",
      });
    }
    const admin = await User.findOne({ mobile, role: "admin" }).select("+password");
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid mobile or password",
      });
    }
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid mobile or password",
      });
    }
    const token = generateToken(admin._id, admin.role, rememberMe);
    return res.status(200).json({
      success: true,
      message: "Admin logged in successfully",
      token,
      user: admin,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

//====== Send OTP ======

export const sendOTPToUser = async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) {
      return res.status(400).json({
        success: false,
        message: "Email and role are required",
      });
    }
    if (!["owner", "trainer"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }
    const user = await User.findOne({ email, role }).select("+otp +otpExpires");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `${role} not found`,
      });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();
    
    const isSent = await sendOTP(email, otp);
    if (!isSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP",
      });
    }
    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

//====== Verify OTP & Login ======

export const verifyOTP = async (req, res) => {
  try {
    const { email, role, otp, rememberMe } = req.body;

    // 1. Validation
    if (!email || !role || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email, role, and OTP are required",
      });
    }

    // 2. Find user with OTP fields
    const user = await User.findOne({ email, role }).select("+otp +otpExpires");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `${role} not found`,
      });
    }

    // 3. Check if OTP matches
    if (user.otp !== otp) {
      return res.status(401).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // 4. Check expiration time
    if (new Date() > user.otpExpires) {
      return res.status(401).json({
        success: false,
        message: "OTP has expired",
      });
    }

    // 5. Clear OTP data so it cannot be used again
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // 6. Generate access token
    const token = generateToken(user._id, user.role, rememberMe);

    return res.status(200).json({
      success: true,
      message: `${role} logged in successfully`,
      token,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
