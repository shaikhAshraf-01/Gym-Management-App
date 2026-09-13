import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Loader2 } from "lucide-react";

const PLAN_DURATIONS = [
  { value: "1_month", label: "1 Month" },
  { value: "3_month", label: "3 Months" },
  { value: "6_month", label: "6 Months" },
  { value: "1_year", label: "1 Year" },
];

export default function MembershipForm({ onSave, onCancel, prefill }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Owner-managed prices from "Manage Plans" — plan amount is
  // auto-computed and locked from these, never typed by hand here.
  const gymPricing = useSelector((state) => state.owner.gym?.pricing);
  const planPrices = gymPricing?.plans || {};
  const activityOptions = gymPricing?.activities || [];
  const activeOffers = (gymPricing?.offers || []).filter((o) => o.active);

  const [formData, setFormData] = useState({
    name: prefill?.name || "",
    mobile: prefill?.mobile || "",
    age: "",
    gender: "",
    plan: "1_month",
    activities: [],
    planAmount: "",
    amountPayingToday: "",
    paymentMode: "upi",
    joiningDate: new Date().toISOString().split("T")[0],
    admissionType: "normal", // "normal" | "offer"
    offerName: "", // which named offer, only used when admissionType is "offer"
    discount: "", // one-off reduction, only usable on Normal admissions
  });

  // Recompute the total amount whenever plan, activities, offer choice
  // or discount change — Normal uses the base Plan Prices; Offer uses
  // the selected named offer's own price list instead. Each
  // activity's price is looked up for the CURRENTLY selected plan
  // duration (Cardio can cost different amounts for 1 Month vs 3
  // Months). Owner never types the total themselves.
  useEffect(() => {
    const isOffer = formData.admissionType === "offer";
    const selectedOffer = isOffer
      ? activeOffers.find((o) => o.name === formData.offerName)
      : null;
    const basePrice = isOffer
      ? Number(selectedOffer?.plans?.[formData.plan]) || 0
      : Number(planPrices[formData.plan]) || 0;

    const activitiesTotal = formData.activities.reduce((sum, activityName) => {
      const match = activityOptions.find((a) => a.name === activityName);
      return sum + (Number(match?.prices?.[formData.plan]) || 0);
    }, 0);

    // Discount only applies to Normal admissions — Offer pricing IS
    // the discount mechanism, so it isn't stacked on top.
    const discount = !isOffer ? Number(formData.discount) || 0 : 0;
    const computedTotal = Math.max(0, basePrice + activitiesTotal - discount);

    setFormData((prev) => {
      if (String(computedTotal) === prev.planAmount) return prev;
      const currentPaid = parseFloat(prev.amountPayingToday) || 0;
      return {
        ...prev,
        planAmount: String(computedTotal),
        amountPayingToday:
          currentPaid > computedTotal ? String(computedTotal) : prev.amountPayingToday,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.plan,
    formData.activities,
    formData.discount,
    formData.admissionType,
    formData.offerName,
    gymPricing,
  ]);

  // ---------------------------------------------------------------
  // Earliest allowed Joining Date — capped to 6 months back from
  // today (no upper cap, so future-dated joining is still allowed).
  // ---------------------------------------------------------------
  const getMinJoiningDate = () => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setHours(0, 0, 0, 0);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return sixMonthsAgo.toISOString().split("T")[0];
  };

  // Prefill listener
  useEffect(() => {
    if (prefill) {
      setFormData((prev) => ({
        ...prev,
        name: prefill.name || "",
        mobile: prefill.mobile || "",
      }));
    }
  }, [prefill]);

  // Plan duration
  const monthsMap = {
    "1_month": 1,
    "3_month": 3,
    "6_month": 6,
    "1_year": 12,
  };

  const monthsToAdd = monthsMap[formData.plan] || 1;

  // Calculate expiry date
  let calculatedExpiry = "";

  if (formData.joiningDate) {
    const date = new Date(formData.joiningDate);

    date.setMonth(date.getMonth() + monthsToAdd);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    calculatedExpiry = `${year}-${month}-${day}`;
  }

  // Amount calculations
  const total = parseFloat(formData.planAmount) || 0;

  const paid = parseFloat(formData.amountPayingToday) || 0;

  const calculatedBalance = Math.max(0, total - paid);

  // Toggle an activity in/out of the selected list
  const handleActivityToggle = (value) => {
    setFormData((prev) => {
      const isSelected = prev.activities.includes(value);
      return {
        ...prev,
        activities: isSelected
          ? prev.activities.filter((a) => a !== value)
          : [...prev.activities, value],
      };
    });
  };

  // Handle change
  const handleChange = (e) => {
    const { name } = e.target;
    let { value } = e.target;

    // Name: letters/spaces only, capped at 32 chars
    if (name === "name") {
      value = value.replace(/[^a-zA-Z\s]/g, "").slice(0, 32);
    }
    // Number-only fields: digits only, no letters/symbols
    else if (["age", "amountPayingToday", "balanceAmount", "discount"].includes(name)) {
      value = value.replace(/[^0-9]/g, "");
    }

    setFormData((prev) => {
      // Amount Paying Today cannot exceed Plan Amount
      if (name === "amountPayingToday") {
        const plan = parseFloat(prev.planAmount) || 0;
        const paidValue = parseFloat(value) || 0;

        return {
          ...prev,
          amountPayingToday:
            plan > 0
              ? String(Math.min(paidValue, plan))
              : value,
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (paid > total) {
      alert(
        "Amount paying today cannot be greater than the Plan Amount!"
      );
      return;
    }

    // Remaining payment date validation
    const finalData = {
      ...formData,
      balanceAmount: calculatedBalance,
      expiryDate: calculatedExpiry,
    };

    setIsSubmitting(true);

    try {
      if (onSave) {
        await onSave(finalData);
      }

      // Reset form
      setFormData({
        name: "",
        mobile: "",
        age: "",
        gender: "",
        plan: "1_month",
        activities: [],
        planAmount: "",
        amountPayingToday: "",
        paymentMode: "upi",
        joiningDate: new Date()
          .toISOString()
          .split("T")[0],
        admissionType: "normal",
        offerName: "",
        discount: "",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-full min-h-0 w-full flex-col overflow-hidden text-slate-700 dark:text-slate-200"
    >
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4">
        <h2 className="text-base font-bold text-slate-800 dark:text-white mb-4 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2">
          New Membership Form
        </h2>
      </div>

      {/* SCROLLABLE FORM AREA */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 overscroll-contain">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Name */}
          <div className="md:col-span-2">
            <label className="block text-xs uppercase font-bold text-slate-600 dark:text-slate-500 mb-1">
              Full Client Name
            </label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              maxLength={32}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-500"
              placeholder="Enter name"
              required
            />
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-xs uppercase font-bold text-slate-600 dark:text-slate-500 mb-1">
              Mobile Number
            </label>

            <input
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              maxLength={10}
              minLength={10}
              pattern="[0-9]{10}"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-500"
              placeholder="**********"
              required
            />
          </div>

          {/* Age + Gender — side by side, even on mobile */}
          <div className="grid grid-cols-2 gap-4 md:col-span-2">
            <div>
              <label className="block text-xs uppercase font-bold text-slate-600 dark:text-slate-500 mb-1">
                Age
              </label>

              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="no-spinner w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-500"
                placeholder="age"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-bold text-slate-600 dark:text-slate-500 mb-1">
                Gender
              </label>

              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Plan */}
          <div>
            <label className="block text-xs uppercase font-bold text-slate-600 dark:text-slate-500 mb-1">
              Select Plan Option
            </label>

            <select
              name="plan"
              value={formData.plan}
              onChange={handleChange}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-500"
            >
              {PLAN_DURATIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label} — ₹{Number(planPrices[value]) || 0}
                </option>
              ))}
            </select>
          </div>

          {/* Admission Type: Normal vs Offer */}
          <div>
            <label className="block text-xs uppercase font-bold text-slate-600 dark:text-slate-500 mb-1">
              Admission Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, admissionType: "normal", offerName: "" }))
                }
                className={`rounded-lg border p-3 text-xs font-semibold transition-colors cursor-pointer ${
                  formData.admissionType === "normal"
                    ? "border-cyan-500 bg-cyan-500/10 text-cyan-400"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    admissionType: "offer",
                    discount: "",
                    offerName: activeOffers[0]?.name || "",
                  }))
                }
                className={`rounded-lg border p-3 text-xs font-semibold transition-colors cursor-pointer ${
                  formData.admissionType === "offer"
                    ? "border-blue-500 bg-blue-500/10 text-blue-400"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                Offer
              </button>
            </div>

            {formData.admissionType === "offer" && (
              <div className="mt-2">
                <label className="block text-xs uppercase font-bold text-slate-600 dark:text-slate-500 mb-1">
                  Select Offer
                </label>
                {activeOffers.length === 0 ? (
                  <p className="text-xs text-amber-500">
                    No active offers — create one in Manage Plans (Profile page).
                  </p>
                ) : (
                  <select
                    value={formData.offerName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, offerName: e.target.value }))
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    {activeOffers.map((offer) => (
                      <option key={offer.name} value={offer.name}>
                        {offer.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {formData.admissionType === "normal" && (
              <div className="mt-2">
                <label className="block text-xs uppercase font-bold text-slate-600 dark:text-slate-500 mb-1">
                  Discount (optional)
                </label>
                <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden">
                  <span className="px-2.5 text-sm text-slate-500">₹</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    name="discount"
                    value={formData.discount}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full bg-transparent p-2.5 pl-0 text-sm text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Activities */}
          <div className="md:col-span-2">
            <label className="block text-xs uppercase font-bold text-slate-600 dark:text-slate-500 mb-1">
              Activities (add-ons)
            </label>

            {activityOptions.length === 0 ? (
              <p className="text-xs text-slate-500">
                No activities set up yet — add some in Manage Plans (Profile
                page) if you charge extra for Cardio, Zumba, etc.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {activityOptions.map((opt) => {
                  const isSelected = formData.activities.includes(opt.name);
                  return (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={() => handleActivityToggle(opt.name)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      {opt.name} — ₹{Number(opt.prices?.[formData.plan]) || 0}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Joining Date */}
          <div>
            <label className="block text-xs uppercase font-bold text-slate-600 dark:text-slate-500 mb-1">
              Joining Date
            </label>

            <input
              type="date"
              name="joiningDate"
              value={formData.joiningDate}
              onChange={handleChange}
              min={getMinJoiningDate()}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-500"
              required
            />

            <p className="text-[10px] text-gray-400 mt-1">
              Up to 6 months back, or any date onwards
            </p>
          </div>

          {/* Plan Amount */}
          <div>
            <label className="block text-xs uppercase font-bold text-slate-600 dark:text-slate-500 mb-1">
              Plan Amount (auto)
            </label>

            <input
              type="text"
              name="planAmount"
              value={`₹${formData.planAmount || 0}`}
              readOnly
              className="no-spinner w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-300 cursor-not-allowed"
            />
            {Number(formData.planAmount) === 0 && (
              <p className="text-[10px] text-amber-500 mt-1">
                Set a price for this plan in Manage Plans (Profile page).
              </p>
            )}
          </div>

          {/* Amount Paying Today */}
          <div>
            <label className="block text-xs uppercase font-bold text-slate-600 dark:text-slate-500 mb-1">
              Amount Paying Today
            </label>

            <input
              type="number"
              name="amountPayingToday"
              value={formData.amountPayingToday}
              onChange={handleChange}
              min="0"
              max={formData.planAmount || undefined}
              className="no-spinner w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm text-emerald-400 font-bold focus:outline-none focus:border-cyan-500"
              placeholder="Enter collected payment"
              required
            />
          </div>

          {/* Balance */}
          <div>
            <label className="block text-xs uppercase font-bold text-slate-600 dark:text-slate-500 mb-1">
              Balance Amount
            </label>

            <input
              type="number"
              name="balanceAmount"
              value={calculatedBalance}
              readOnly
              className="no-spinner w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm text-red-400 font-bold cursor-not-allowed outline-none"
              placeholder="Calculated automatically"
            />
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-xs uppercase font-bold text-slate-600 dark:text-slate-500 mb-1">
              Payment Mode
            </label>

            <select
              name="paymentMode"
              value={formData.paymentMode}
              onChange={handleChange}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="upi">
                UPI
              </option>

              <option value="cash">
                Cash
              </option>
            </select>
          </div>

          {/* Expiry Date */}
          <div
            className={
              calculatedBalance > 0
                ? ""
                : "md:col-span-2"
            }
          >
            <label className="block text-xs uppercase font-bold text-gray-400 mb-1">
              Automatic Plan Expiry Date
            </label>

            <input
              type="date"
              name="expiryDate"
              value={calculatedExpiry}
              readOnly
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm text-cyan-400 font-semibold cursor-not-allowed outline-none"
            />
          </div>

        </div>
        <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 py-4">
        <div className="flex flex-row gap-2 sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 sm:max-w-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 rounded-lg bg-blue-600 p-3 text-sm font-semibold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:max-w-xs"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>
      </div>

      {/* Remove number input spinner */}
      <style>{`
        .no-spinner::-webkit-outer-spin-button,
        .no-spinner::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .no-spinner {
          -moz-appearance: textfield;
        }
      `}</style>
    </form>
  );
}