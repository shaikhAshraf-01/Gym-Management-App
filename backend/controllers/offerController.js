import Gym from "../models/Gym.js";
import GymOffer from "../models/GymOffer.js";
import GymSubscriptionHistory from "../models/GymSubscriptionHistory.js";
import { resolveAudience } from "../utils/resolveAudience.js";

const PLANS_WITH_WHATSAPP_AUTOMATION = ["Plus", "Pro"];

const assertPlusOrProPlan = async (gymId) => {
  const activeSub = await GymSubscriptionHistory.findOne({
    gymId,
    endDate: { $gte: new Date() },
  }).sort({ endDate: -1 });

  return !!activeSub && PLANS_WITH_WHATSAPP_AUTOMATION.includes(activeSub.subscriptionPlan);
};

// POST /api/owner/whatsapp/offers
export const createOffer = async (req, res) => {
  try {
    const gym = await Gym.findOne({ owner: req.user._id });
    if (!gym) {
      return res.status(404).json({ success: false, message: "Gym not found." });
    }

    if (!(await assertPlusOrProPlan(gym._id))) {
      return res.status(403).json({
        success: false,
        message: "Offer Broadcasts are available on Plus and Pro plans only.",
      });
    }

    if (!gym.whatsappIntegration?.connected) {
      return res.status(400).json({
        success: false,
        message: "Connect your WhatsApp Business Account first.",
      });
    }

    const { templateName, scheduledDate, audience } = req.body;
    if (!templateName || !scheduledDate || !audience) {
      return res.status(400).json({
        success: false,
        message: "Template name, date, and audience are all required.",
      });
    }

    const offer = await GymOffer.create({
      gym: gym._id,
      templateName: templateName.trim(),
      scheduledDate: new Date(scheduledDate),
      audience,
      createdBy: req.user._id,
    });

    return res.status(201).json({ success: true, message: "Offer scheduled.", offer });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to schedule offer." });
  }
};

// GET /api/owner/whatsapp/offers
export const listOffers = async (req, res) => {
  try {
    const gym = await Gym.findOne({ owner: req.user._id });
    if (!gym) {
      return res.status(404).json({ success: false, message: "Gym not found." });
    }

    const offers = await GymOffer.find({ gym: gym._id }).sort({ scheduledDate: -1 });
    return res.status(200).json({ success: true, offers });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to fetch offers." });
  }
};

// GET /api/owner/whatsapp/offers/audience-count?audience=active_members
// Lets the frontend show "this will reach ~42 people" before scheduling.
export const getAudienceCount = async (req, res) => {
  try {
    const gym = await Gym.findOne({ owner: req.user._id });
    if (!gym) {
      return res.status(404).json({ success: false, message: "Gym not found." });
    }

    const { audience } = req.query;
    const recipients = await resolveAudience(gym._id, audience);
    return res.status(200).json({ success: true, count: recipients.length });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to count audience." });
  }
};

// DELETE /api/owner/whatsapp/offers/:id
export const cancelOffer = async (req, res) => {
  try {
    const gym = await Gym.findOne({ owner: req.user._id });
    if (!gym) {
      return res.status(404).json({ success: false, message: "Gym not found." });
    }

    const offer = await GymOffer.findOne({ _id: req.params.id, gym: gym._id });
    if (!offer) {
      return res.status(404).json({ success: false, message: "Offer not found." });
    }
    if (offer.status !== "scheduled") {
      return res.status(400).json({
        success: false,
        message: "Only a still-scheduled offer can be cancelled.",
      });
    }

    offer.status = "cancelled";
    await offer.save();

    return res.status(200).json({ success: true, message: "Offer cancelled.", offer });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to cancel offer." });
  }
};