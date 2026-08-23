import jwt from "jsonwebtoken";
import User from "../models/User.js";
import sendOTPEmails from "../utils/sendOTPEmails.js";

// Token now always lives for JWT_EXPIRE (set this to something long in
// .env, e.g. "90d") regardless of "Remember Me" — the old behaviour
// silently expired non-rememberMe sessions after just 1 day, which is
// what was killing sessions mid-use. Actual logout is what clears the
// session client-side now (see axios.js's 401 interceptor + authSlice's
// logout action), not token expiry.
const generateToken = (userId, role, tokenVersion) => {
  return jwt.sign(
    {
      id: userId,
      role,
      tokenVersion,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE,
    },
  );
};

// Turns "90d" / "12h" / "45m" (the same format used for JWT_EXPIRE) into
// milliseconds for the cookie's maxAge. Falls back to 90 days if
// JWT_EXPIRE is missing or in a shape this doesn't understand.
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
const parseExpiryToMs = (value) => {
  const match = /^(\d+)([smhd])$/.exec(String(value || "").trim());
  if (!match) return NINETY_DAYS_MS;

  const amount = Number(match[1]);
  const unitMs = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return amount * unitMs[match[2]];
};

// Sets the httpOnly auth cookie used by the WEBSITE. The Capacitor app
// keeps using the JSON `token` field + native secure storage instead
// (cross-origin cookies inside a WebView are unreliable) — this cookie
// is purely for browser sessions, where it protects the token from
// being readable by any injected/XSS'd JavaScript.
const setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: parseExpiryToMs(process.env.JWT_EXPIRE),
    path: "/",
  });
};

const clearAuthCookie = (res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });
};

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  mobile: user.mobile,
  role: user.role,
  photo: user.photo,
});

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
    const token = generateToken(admin._id, admin.role, admin.tokenVersion);

    // Website: httpOnly cookie (JS can't touch it, XSS-proof).
    // APK: keeps using the `token` field below via native secure storage.
    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "Admin logged in successfully",
      token,
      user: publicUser(admin),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",    });
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

    // Same response whether the account exists or not — otherwise an
    // attacker can mass-try emails and use the 404-vs-200 difference to
    // build a list of real, registered gym-owner/trainer emails (a
    // classic user-enumeration bug, and a ready-made target list for
    // phishing). Only an existing user actually gets an email sent.
    if (user) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otp = otp;
      user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
      await user.save();

      const isSent = await sendOTPEmails(email, otp);
      if (!isSent) {
        // Log server-side for ops visibility; client response stays
        // generic either way, so this never becomes an enumeration signal.
        console.error(`sendOTP: email dispatch failed for ${role} ${email}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: "If this account exists, an OTP has been sent.",
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
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

    // Same message as a wrong OTP — an attacker shouldn't be able to
    // tell "no such account" apart from "you typed the wrong code".
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // 3. Check if OTP matches
    if (user.otp !== otp) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // 4. Check expiration time
    if (new Date() > user.otpExpires) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // 5. Clear OTP data so it cannot be used again
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    // 6. Generate access token
    const token = generateToken(user._id, user.role, user.tokenVersion);

    // Website: httpOnly cookie. APK: `token` field + native secure storage.
    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: `${role} logged in successfully`,
      token,
      user: publicUser(user),
    });
  } catch  {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//====== Get Current Session (used for session-restore on the website) ======
//
// The website has no client-readable way to check "am I logged in?" since
// the auth cookie is httpOnly by design — so it asks the backend instead.
// `protect` (authMiddleware) already validated the cookie/token and set
// req.user before this runs.
export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: publicUser(req.user),
  });
};

//====== Logout ======
//
// Clearing localStorage/secure-storage on the client only handles the
// APK/token side — the website's httpOnly cookie can't be cleared by
// client JS at all, so the browser needs the server to explicitly tell
// it (via Set-Cookie) to drop the cookie.
export const logoutUser = async (req, res) => {
  clearAuthCookie(res);
  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};