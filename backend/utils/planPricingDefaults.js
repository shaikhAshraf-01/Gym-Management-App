import PlanPricing from "../models/PlanPricing.js";

// Seed values — mirror the current static PLANS prices in
// frontend/src/components/ownerComponents/PlanSelectionModal.jsx.
// Used only the very first time the pricing doc is read, before an
// admin has ever published anything, so nothing breaks in the
// meantime. Pro has no published pricing yet (still "Coming Soon"
// on the frontend), so it seeds at 0.
export const DEFAULT_PLAN_PRICING = {
  Basic: { price1: 249, price3: 599, price6: 999, price12: 1699, badgeText: "", badgeActive: false },
  Plus: { price1: 349, price3: 849, price6: 1399, price12: 2499, badgeText: "", badgeActive: false },
  Pro: { price1: 0, price3: 0, price6: 0, price12: 0, badgeText: "", badgeActive: false },
};

// Fetches the singleton pricing doc, creating it from the defaults
// above on first-ever read. Shared by the admin and owner controllers.
export const getOrSeedPlanPricing = async () => {
  let doc = await PlanPricing.findOne({ key: "current" });
  if (!doc) {
    doc = await PlanPricing.create({ key: "current", ...DEFAULT_PLAN_PRICING });
  }
  return doc;
};