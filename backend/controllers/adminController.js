import User from "../models/User.js";


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
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};
// controllers/adminController.js

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // 1. Force-select the password field because of 'select: false' in schema
    const admin = await User.findById(req.user._id).select("+password");

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin profile not found." });
    }

    // 2. Validate current password match
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect current password." });
    }

    // 3. Assign new password (the pre('save') hook handles hashing automatically)
    admin.password = newPassword;
    await admin.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully."
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
