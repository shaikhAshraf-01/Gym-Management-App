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