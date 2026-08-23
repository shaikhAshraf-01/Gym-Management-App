import express from "express";
import rateLimit from "express-rate-limit";
import { adminLogin, sendOTP, verifyOTP, getMe, logoutUser } from "../controllers/authController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
const router=express.Router();

// Only login/OTP endpoints are brute-force targets — /me and /logout
// get called on every page load / app action during normal use, so
// they stay under server.js's looser general limiter instead.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Please try again after 15 minutes.",
  },
});

router.post("/admin-login", authLimiter, adminLogin);
router.post("/send-otp", authLimiter, sendOTP);
router.post("/verify-otp", authLimiter, verifyOTP);

// Website session-restore: relies on the httpOnly cookie to identify
// the user, since client JS has no way to read that cookie itself.
router.get("/me", authMiddleware, getMe);

// Clears the httpOnly cookie server-side — client JS cannot clear an
// httpOnly cookie on its own.
router.post("/logout", logoutUser);

export default router;