import User from "../models/User.js";
import bcrypt from "bcryptjs"; // 🚀 Import bcrypt directly into the controller
import { getOrSeedPlanPricing } from "../utils/planPricingDefaults.js";
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
// ===== Plan Pricing (subscription plans admin sells to gym owners —
// Basic / Plus / Pro. NOT a gym's own member/fees pricing.) =====

export const getPlanPricing = async (req, res) => {
  try {
    const doc = await getOrSeedPlanPricing();

    return res.status(200).json({
      success: true,
      data: {
        Basic: doc.Basic,
        Plus: doc.Plus,
        Pro: doc.Pro,
        updatedAt: doc.updatedAt,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export const updatePlanPricing = async (req, res) => {
  try {
    const { Basic, Plus, Pro } = req.body;

    const tiers = { Basic, Plus, Pro };
    const numericFields = ["price1", "price3", "price6", "price12"];

    for (const [tierName, tier] of Object.entries(tiers)) {
      if (!tier || typeof tier !== "object") {
        return res.status(400).json({
          success: false,
          message: `Missing pricing for ${tierName}.`,
        });
      }

      for (const field of numericFields) {
        const value = Number(tier[field]);
        if (!Number.isFinite(value) || value < 0) {
          return res.status(400).json({
            success: false,
            message: `${tierName} ${field} must be a valid non-negative number.`,
          });
        }
      }

      if (tier.badgeText && String(tier.badgeText).length > 60) {
        return res.status(400).json({
          success: false,
          message: `${tierName} badge text must be 60 characters or fewer.`,
        });
      }
    }

    const buildTier = (tier) => ({
      price1: Number(tier.price1),
      price3: Number(tier.price3),
      price6: Number(tier.price6),
      price12: Number(tier.price12),
      badgeText: String(tier.badgeText || "").trim(),
      badgeActive: !!tier.badgeActive,
    });

    const doc = await getOrSeedPlanPricing();

    doc.Basic = buildTier(Basic);
    doc.Plus = buildTier(Plus);
    doc.Pro = buildTier(Pro);
    doc.publishedBy = req.user._id;

    await doc.save();

    return res.status(200).json({
      success: true,
      message: "Plan pricing published successfully.",
      data: {
        Basic: doc.Basic,
        Plus: doc.Plus,
        Pro: doc.Pro,
        updatedAt: doc.updatedAt,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};