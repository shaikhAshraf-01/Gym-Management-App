import express from "express";
import {adminLogin, sendOTP, verifyOTP} from "../controllers/authController.js";
const router=express.Router();

router.post("/admin-login", adminLogin);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);

export default router;