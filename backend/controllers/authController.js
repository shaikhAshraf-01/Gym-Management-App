import jwt from "jsonwebtoken";
import User from "../models/User.js";
import sendOTPEmails from "../utils/sendOTPEmails.js";

// Token now always lives for JWT_EXPIRE (set this to something long in
// .env, e.g. "90d") regardless of "Remember Me" — the old behaviour
// silently expired non-rememberMe sessions after just 1 day, which is
// what was killing sessions mid-use. Actual logout is what clears the
// session client-side now (see axios.js's 401 interceptor + authSlice's
// logout action), not token expiry.
const generateToken = (userId, role) => {
  return jwt.sign(
    {
      id: userId,
      role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE,
    },
  );
};

//====== Admin Login ======

export const adminLogin = async (req, res) => {
  try {
    const { mobile, password } = req.body;
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
    const token = generateToken(admin._id, admin.role);
    return res.status(200).json({
      success: true,
      message: "Admin logged in successfully",
      token,
      user: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        mobile: admin.mobile,
        role: admin.role,
        photo: admin.photo,
      },
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
export const sendOTP = async (req, res) => {
  try {
    const { email, role } = req.body;
    
    if (!email || !role) {
      return res.status(400).json({ success: false, message: "Email and role are required" });
    }

    if (!["owner", "trainer"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const user = await User.findOne({ email, role }).select("+otp +otpExpires");
    if (!user) {
      return res.status(404).json({ success: false, message: `${role} not found` });
    }

    // 1. Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    // 2. Dispatch OTP via Resend (Ensure this variable name matches your import)
    const isSent = await sendOTPEmails(email, otp);

    if (!isSent) {
      return res.status(500).json({ success: false, message: "Failed to send OTP" });
    }

    return res.status(200).json({ success: true, message: "OTP sent successfully" });

  } catch (error) {
    // CRITICAL: Always return error.message here during testing so your frontend 
    // can tell you exactly what crashed instead of just saying "500"
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};


//====== Verify OTP & Login ======

export const verifyOTP = async (req, res) => {
  try {
    const { email, role, otp } = req.body;

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
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    // 6. Generate access token
    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: `${role} logged in successfully`,
      token,
      user:{
        _id:user._id,
        name:user.name,
        email:user.email,
        mobile:user.mobile,
        role:user.role,
        photo:user.photo,
      }
    });
  } catch  {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};