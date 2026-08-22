import User from "../models/User.js";
import bcrypt from "bcryptjs"; // 🚀 Import bcrypt directly into the controller

// ===== Get Admin Profile =====

export const getAdminProfile = async (req, res) => {
  try {
    const admin = await User.findById(req.user._id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: admin,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",    });
  }
};

 

export const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // 1. Force select the password using the base User query instance
    const admin = await User.findById(req.user._id).select("+password");

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin profile not found." });
    }

    // 2. Validate current password match
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect current password." });
    }

    // 3. 🚀 THE ULTIMATE FIX: Hash manually and perform an atomic collection patch
    // This safely avoids Mongoose model save validation triggers and discriminator state bugs
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.updateOne(
      { _id: req.user._id },
      { $set: { password: hashedPassword }, $inc: { tokenVersion: 1 } }
    );

    return res.status(200).json({
      success: true,
      // Their current token is now invalid too (by design) — the
      // frontend's 401 handling will bounce them to login on the next
      // request, same as any other revoked session.
      message: "Password updated successfully. Please log in again.",
    });

  } catch (error) {
    console.error(error);
    // Standardize error formats for the frontend tracking layer
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error.",    });
  }
};