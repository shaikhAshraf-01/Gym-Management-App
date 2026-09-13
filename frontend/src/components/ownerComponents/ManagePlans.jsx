import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Wallet,
  Plus,
  Trash2,
  Save,
  Loader2,
  Tag,
} from "lucide-react";
import { updateGymPricing } from "../../redux/slices/ownerSlice";

const PLAN_DURATIONS = [
  { key: "1_month", label: "1 Month" },
  { key: "3_month", label: "3 Months" },
  { key: "6_month", label: "6 Months" },
  { key: "1_year", label: "1 Year" },
];

const emptyDurationPrices = () => ({
  "1_month": "",
  "3_month": "",
  "6_month": "",
  "1_year": "",
});

// Compact 4-box duration price grid — reused for the base Plan Prices,
// each Activity's per-duration prices, and each Offer's own price list.
function DurationPriceGrid({ prices, onChange }) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {PLAN_DURATIONS.map(({ key, label }) => (
        <div key={key}>
          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">
            {label}
          </label>
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
            <span className="pl-1.5 text-xs text-slate-500">₹</span>
            <input
              type="text"
              inputMode="numeric"
              value={prices[key]}
              onChange={(e) =>
                onChange(key, e.target.value.replace(/[^0-9]/g, ""))
              }
              className="w-full bg-transparent p-1.5 pl-0.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
              placeholder="0"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ManagePlans() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const gym = useSelector((state) => state.owner.gym);
  const pricingActionLoading = useSelector(
    (state) => state.owner.pricingActionLoading
  );
  const pricingActionError = useSelector(
    (state) => state.owner.pricingActionError
  );

  const savedPlans = gym?.pricing?.plans || {};
  const savedActivities = gym?.pricing?.activities || [];
  const savedOffers = gym?.pricing?.offers || [];

  const [plans, setPlans] = useState({
    "1_month": savedPlans["1_month"] ?? "",
    "3_month": savedPlans["3_month"] ?? "",
    "6_month": savedPlans["6_month"] ?? "",
    "1_year": savedPlans["1_year"] ?? "",
  });

  const [activities, setActivities] = useState(
    savedActivities.length > 0
      ? savedActivities.map((a) => ({
          name: a.name,
          prices: {
            "1_month": a.prices?.["1_month"] ?? "",
            "3_month": a.prices?.["3_month"] ?? "",
            "6_month": a.prices?.["6_month"] ?? "",
            "1_year": a.prices?.["1_year"] ?? "",
          },
        }))
      : [{ name: "", prices: emptyDurationPrices() }]
  );

  const [offers, setOffers] = useState(
    savedOffers.length > 0
      ? savedOffers.map((o) => ({
          name: o.name,
          active: o.active !== false,
          plans: {
            "1_month": o.plans?.["1_month"] ?? "",
            "3_month": o.plans?.["3_month"] ?? "",
            "6_month": o.plans?.["6_month"] ?? "",
            "1_year": o.plans?.["1_year"] ?? "",
          },
        }))
      : []
  );

  const [saved, setSaved] = useState(false);

  const markDirty = () => setSaved(false);

  const handlePlanChange = (key, value) => {
    setPlans((prev) => ({ ...prev, [key]: value }));
    markDirty();
  };

  // ---- Activities ----
  const handleActivityNameChange = (index, value) => {
    setActivities((prev) =>
      prev.map((a, i) =>
        i === index
          ? { ...a, name: value.replace(/[^a-zA-Z\s]/g, "").slice(0, 24) }
          : a
      )
    );
    markDirty();
  };
  const handleActivityPriceChange = (index, durationKey, value) => {
    setActivities((prev) =>
      prev.map((a, i) =>
        i === index ? { ...a, prices: { ...a.prices, [durationKey]: value } } : a
      )
    );
    markDirty();
  };
  const addActivityRow = () => {
    setActivities((prev) => [...prev, { name: "", prices: emptyDurationPrices() }]);
  };
  const removeActivityRow = (index) => {
    setActivities((prev) => prev.filter((_, i) => i !== index));
    markDirty();
  };

  // ---- Offers ----
  const handleOfferNameChange = (index, value) => {
    setOffers((prev) =>
      prev.map((o, i) =>
        i === index
          ? { ...o, name: value.replace(/[^a-zA-Z0-9\s]/g, "").slice(0, 30) }
          : o
      )
    );
    markDirty();
  };
  const handleOfferPriceChange = (index, durationKey, value) => {
    setOffers((prev) =>
      prev.map((o, i) =>
        i === index ? { ...o, plans: { ...o.plans, [durationKey]: value } } : o
      )
    );
    markDirty();
  };
  const toggleOfferActive = (index) => {
    setOffers((prev) =>
      prev.map((o, i) => (i === index ? { ...o, active: !o.active } : o))
    );
    markDirty();
  };
  const addOfferRow = () => {
    setOffers((prev) => [
      ...prev,
      { name: "", active: true, plans: emptyDurationPrices() },
    ]);
  };
  const removeOfferRow = (index) => {
    setOffers((prev) => prev.filter((_, i) => i !== index));
    markDirty();
  };

  const handleSave = async () => {
    const cleanedActivities = activities
      .filter((a) => a.name.trim())
      .map((a) => ({
        name: a.name.trim(),
        prices: {
          "1_month": Number(a.prices["1_month"]) || 0,
          "3_month": Number(a.prices["3_month"]) || 0,
          "6_month": Number(a.prices["6_month"]) || 0,
          "1_year": Number(a.prices["1_year"]) || 0,
        },
      }));

    const cleanedOffers = offers
      .filter((o) => o.name.trim())
      .map((o) => ({
        name: o.name.trim(),
        active: o.active,
        plans: {
          "1_month": Number(o.plans["1_month"]) || 0,
          "3_month": Number(o.plans["3_month"]) || 0,
          "6_month": Number(o.plans["6_month"]) || 0,
          "1_year": Number(o.plans["1_year"]) || 0,
        },
      }));

    const result = await dispatch(
      updateGymPricing({
        plans: {
          "1_month": Number(plans["1_month"]) || 0,
          "3_month": Number(plans["3_month"]) || 0,
          "6_month": Number(plans["6_month"]) || 0,
          "1_year": Number(plans["1_year"]) || 0,
        },
        activities: cleanedActivities,
        offers: cleanedOffers,
      })
    );

    if (updateGymPricing.fulfilled.match(result)) {
      setSaved(true);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-cyan-500/10 p-2.5 text-cyan-400">
          <Wallet size={20} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-700 dark:text-slate-100">Manage Plans</h1>
          <p className="text-xs text-slate-600 dark:text-slate-500">
            Set prices once — Add Member &amp; Renew forms auto-fill from here
          </p>
        </div>
      </div>

      {pricingActionError && (
        <div className="mb-4 rounded-xl border border-rose-900 bg-rose-950/40 px-4 py-3 text-xs text-rose-300">
          {pricingActionError}
        </div>
      )}

      {/* ===================== PLAN PRICES (Normal) ===================== */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 mb-4">
        <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-100">
          Plan Prices (Normal)
        </p>
        <DurationPriceGrid prices={plans} onChange={handlePlanChange} />
        <p className="mt-3 text-xs text-slate-500">
          Used for every Normal admission. Offer admissions use a
          separate price list below instead of this one.
        </p>
      </div>

      {/* ===================== ACTIVITIES ===================== */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 mb-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">
            Activities (add-ons)
          </p>
          <button
            type="button"
            onClick={addActivityRow}
            className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400"
          >
            <Plus size={14} />
            Add
          </button>
        </div>

        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div
              key={index}
              className="rounded-lg border border-slate-200 dark:border-slate-700 p-2.5"
            >
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={activity.name}
                  onChange={(e) => handleActivityNameChange(index, e.target.value)}
                  placeholder="e.g. Cardio"
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => removeActivityRow(index)}
                  className="shrink-0 p-2 rounded-lg border border-rose-900/40 bg-rose-950/20 text-rose-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <DurationPriceGrid
                prices={activity.prices}
                onChange={(key, val) => handleActivityPriceChange(index, key, val)}
              />
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Each activity has its own price per plan duration — e.g. Cardio
          can be ₹300 for 1 Month but ₹900 for 3 Months (not just 3×). The
          price matching the member's selected plan gets added on top
          automatically.
        </p>
      </div>

      {/* ===================== OFFERS (named campaigns) ===================== */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 mb-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-100 flex items-center gap-1.5">
            <Tag size={14} className="text-blue-500" />
            Offers (e.g. Diwali Offer, New Year Offer)
          </p>
          <button
            type="button"
            onClick={addOfferRow}
            className="inline-flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400"
          >
            <Plus size={14} />
            New Offer
          </button>
        </div>

        {offers.length === 0 && (
          <p className="text-xs text-slate-500">
            No offers yet — add one for a festival/seasonal price list,
            e.g. "Diwali Offer" with its own 1 Month/3 Month/etc. prices.
          </p>
        )}

        <div className="space-y-3">
          {offers.map((offer, index) => (
            <div
              key={index}
              className={`rounded-lg border p-2.5 ${
                offer.active
                  ? "border-blue-500/40"
                  : "border-slate-200 dark:border-slate-700 opacity-60"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={offer.name}
                  onChange={(e) => handleOfferNameChange(index, e.target.value)}
                  placeholder="e.g. Diwali Offer"
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => toggleOfferActive(index)}
                  className={`shrink-0 px-2.5 py-2 rounded-lg text-xs font-semibold border ${
                    offer.active
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                      : "border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  {offer.active ? "Active" : "Inactive"}
                </button>
                <button
                  type="button"
                  onClick={() => removeOfferRow(index)}
                  className="shrink-0 p-2 rounded-lg border border-rose-900/40 bg-rose-950/20 text-rose-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <DurationPriceGrid
                prices={offer.plans}
                onChange={(key, val) => handleOfferPriceChange(index, key, val)}
              />
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          When Add Member/Renew has "Offer" selected, the owner picks one
          of these active offers — its prices are used instead of the
          Normal price list above. Turn an offer "Inactive" once it ends,
          without losing its name/prices for past records.
        </p>
      </div>

      <button
        onClick={handleSave}
        disabled={pricingActionLoading}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-lime-400 py-3 font-bold text-slate-900 disabled:opacity-60"
      >
        {pricingActionLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Save size={18} />
        )}
        {saved ? "Saved!" : "Save Pricing"}
      </button>
    </div>
  );
}