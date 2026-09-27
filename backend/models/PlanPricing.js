import mongoose from "mongoose";

// One embedded sub-document per subscription tier (Basic / Plus / Pro).
// This is the price we charge the GYM OWNER to subscribe to the app —
// not the gym's own membership fees (that's Gym.js / member pricing).
const tierPricingSchema = new mongoose.Schema(
  {
    price1: { type: Number, required: true, min: 0 },  // 1 month
    price3: { type: Number, required: true, min: 0 },  // 3 months
    price6: { type: Number, required: true, min: 0 },  // 6 months
    price12: { type: Number, required: true, min: 0 }, // 12 months
    // Optional short promo badge shown on the plan card in
    // PlanSelectionModal, e.g. "Diwali Offer — Save 15%".
    // Only rendered on the owner side when badgeActive is true.
    badgeText: { type: String, default: "", trim: true, maxlength: 60 },
    badgeActive: { type: Boolean, default: false },
  },
  { _id: false }
);

const planPricingSchema = new mongoose.Schema(
  {
    // Singleton document — there is always exactly one record holding
    // all three tiers together, since admin edits and publishes them
    // as a single unit from one form (see adminController.updatePlanPricing).
    key: { type: String, default: "current", unique: true },
    Basic: { type: tierPricingSchema, required: true },
    Plus: { type: tierPricingSchema, required: true },
    Pro: { type: tierPricingSchema, required: true },
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const PlanPricing = mongoose.model("PlanPricing", planPricingSchema);
export default PlanPricing;