import GymSubscriptionHistory from "../models/GymSubscriptionHistory.js";

// Plans that unlock WhatsApp automation, Offer Broadcasts, etc.
// Kept in one place so every controller checks the same list.
const PLANS_WITH_WHATSAPP_AUTOMATION = ["Plus", "Pro"];

// Shared check used by ownerController (WhatsApp automation) and
// offerController (Offer Broadcasts) — both need to confirm the gym
// currently has an active Plus or Pro subscription.
export const hasActivePlusOrProPlan = async (gymId) => {
  const activeSub = await GymSubscriptionHistory.findOne({
    gymId,
    endDate: { $gte: new Date() },
  }).sort({ endDate: -1 });

  return (
    !!activeSub &&
    PLANS_WITH_WHATSAPP_AUTOMATION.includes(activeSub.subscriptionPlan)
  );
};