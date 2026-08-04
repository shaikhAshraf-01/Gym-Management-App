import Gym from "../models/Gym.js";
import { Owner } from "../models/User.js";
import User from "../models/User.js";
import GymSubscriptionHistory from "../models/GymSubscriptionHistory.js";

// @route   POST /api/gyms
// @access  Private (admin only)
export const createGym = async (req, res) => {
  const {
    gymCode,
    gymName,
    location,
    ownerName,
    ownerMobile,
    ownerEmail,
    subscriptionPlan,
    amount,
    paymentMode,
    durationMonths,
  } = req.body;

  if (!gymCode || !gymName || !location || !ownerName || !ownerMobile || !ownerEmail || !subscriptionPlan || !amount || !paymentMode || !durationMonths) {
    return res.status(400).json({
      success: false,
      message: "gymCode, gymName, location, ownerName, ownerMobile, ownerEmail, subscriptionPlan, amount, paymentMode, and durationMonths are all required.",
    });
  }

  const existingUser = await User.findOne({ $or: [{ mobile: ownerMobile }, { email: ownerEmail }] });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "A user with this owner mobile number or email already exists.",
    });
  }

  let gym;
  try {
    // Step 1: create the gym (owner left unset)
    gym = await Gym.create({ gymCode, gymName, location });

    // Step 2: create the owner — no password, OTP-based login
    const owner = await Owner.create({
      name: ownerName,
      mobile: ownerMobile,
      email: ownerEmail,
      gymId: gym._id,
    });

    // Step 3: link the gym back to its new owner
    gym.owner = owner._id;
    await gym.save();

    // Step 4: create the initial subscription entry
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + Number(durationMonths));

    const subscription = await GymSubscriptionHistory.create({
      gymId: gym._id,
      subscriptionPlan,
      durationMonths,
      amount: Number(amount),
      paymentMode,
      startDate,
      endDate,
    });

    return res.status(201).json({
      success: true,
      gym,
      owner: { id: owner._id, name: owner.name, mobile: owner.mobile, email: owner.email },
      subscription,
    });
  } catch (error) {
    // Roll back the orphaned gym if a later step failed
    if (gym && !gym.owner) {
      await Gym.findByIdAndDelete(gym._id);
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};