import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";

const PLAN_DURATIONS = [
  { value: "1_month", label: "1 Month" },
  { value: "3_month", label: "3 Months" },
  { value: "6_month", label: "6 Months" },
  { value: "1_year", label: "1 Year" },
];

export default function ExtendMembershipModal({
  member,
  onSave,
  onClose,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Owner-managed prices from "Manage Plans" — amount is auto-computed
  // and locked from these, never typed by hand here.
  const gymPricing = useSelector((state) => state.owner.gym?.pricing);
  const planPrices = gymPricing?.plans || {};
  const activityOptions = gymPricing?.activities || [];
  const activeOffers = (gymPricing?.offers || []).filter((o) => o.active);

  const [formData, setFormData] = useState({
    plan: "1_month",
    activities: [],
    extensionAmount: "",
    amountPayingToday: "",
    balanceAmount: "0",
    paymentMode: "upi",
    newStartDate: "",
    newExpiryDate: "",
    admissionType: "normal", // "normal" | "offer"
    offerName: "",
    discount: "", // one-off reduction, only usable on Normal admissions
  });

  // Recompute the total whenever plan, activities, offer choice or
  // discount change — Normal uses the base Plan Prices; Offer uses
  // the selected named offer's own price list instead. Each
  // activity's price is looked up for the CURRENTLY selected plan
  // duration.
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

    const discount = !isOffer ? Number(formData.discount) || 0 : 0;
    const computedTotal = Math.max(0, basePrice + activitiesTotal - discount);

    setFormData((prev) => {
      if (String(computedTotal) === prev.extensionAmount) return prev;
      const currentPaid = parseFloat(prev.amountPayingToday) || 0;
      return {
        ...prev,
        extensionAmount: String(computedTotal),
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

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const calculateDefaultStartDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate = new Date(today);

    if (member?.expiryDate) {
      const currentExpiry = new Date(member.expiryDate);
      currentExpiry.setHours(0, 0, 0, 0);

      if (currentExpiry >= today) {
        startDate = new Date(currentExpiry);
        startDate.setDate(startDate.getDate() + 1);
      }
    }

    return formatDate(startDate);
  };

  const getMinStartDate = () => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setHours(0, 0, 0, 0);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    return formatDate(sixMonthsAgo);
  };

  useEffect(() => {
    if (!member || !formData.newStartDate) return;

    let monthsToAdd = 1;

    if (formData.plan === "3_month") {
      monthsToAdd = 3;
    } else if (formData.plan === "6_month") {
      monthsToAdd = 6;
    } else if (formData.plan === "1_year") {
      monthsToAdd = 12;
    }

    const startDate = new Date(`${formData.newStartDate}T12:00:00`);
    const expiryDate = new Date(startDate);
    expiryDate.setMonth(expiryDate.getMonth() + monthsToAdd);

    setFormData((prev) => ({
      ...prev,
      newExpiryDate: formatDate(expiryDate),
    }));
  }, [formData.plan, formData.newStartDate, member]);

  useEffect(() => {
    const fee = Number(formData.extensionAmount) || 0;
    const paid = Number(formData.amountPayingToday) || 0;
    const balance = Math.max(0, fee - paid);

    setFormData((prev) => ({
      ...prev,
      balanceAmount: String(balance),
    }));
  }, [formData.extensionAmount, formData.amountPayingToday]);

  useEffect(() => {
    if (!member) return;

    setFormData({
      plan: member.plan || "1_month",
      activities: member.activities || [],
      extensionAmount: "",
      amountPayingToday: "",
      balanceAmount: "0",
      // "both" was removed as a selectable option — old records saved
      // with it fall back to "cash" so the dropdown always has a
      // valid selection.
      paymentMode: member.paymentMode === "both" ? "cash" : member.paymentMode || "upi",
      newStartDate: calculateDefaultStartDate(),
      newExpiryDate: "",
      admissionType: "normal",
      offerName: "",
      discount: "",
    });
  }, [member]);

  useEffect(() => {
    if (!member) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
    };
  }, [member]);

  if (!member) return null;

  const handleChange = (e) => {
    const { name } = e.target;
    let { value } = e.target;

    // Number-only fields: digits only, no letters/symbols
    if (["amountPayingToday", "balanceAmount", "discount"].includes(name)) {
      value = value.replace(/[^0-9]/g, "");
    }

    setFormData((prev) => {
      if (name === "amountPayingToday") {
        const fee = Number(prev.extensionAmount) || 0;
        const paid = Number(value) || 0;

        return {
          ...prev,
          amountPayingToday: fee > 0 ? String(Math.min(paid, fee)) : value,
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSave(member.id, {
        plan: formData.plan,
        activities: formData.activities,
        extensionAmount: formData.extensionAmount,
        amountPayingToday: formData.amountPayingToday,
        balanceAmount: formData.balanceAmount,
        paymentMode: formData.paymentMode,
        newStartDate: formData.newStartDate,
        admissionType: formData.admissionType,
        offerName: formData.offerName,
        discount: formData.discount,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal((
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/70 p-3 backdrop-blur-sm [touch-action:pan-y] sm:p-4">
      <div className="flex min-h-full items-start justify-center sm:items-center">
      <div className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] text-slate-700 dark:text-slate-100 shadow-2xl sm:max-h-[calc(100dvh-2rem)]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-[#131b2e] z-10">
          <h2 className="text-base font-extrabold text-lime-400 uppercase tracking-wider">
            Membership Detail
          </h2>

          <button
            onClick={onClose}
            className="p-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 rounded-lg cursor-pointer transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Plan */}
            <div>
              <label className="block text-xs uppercase font-bold text-slate-600 dark:text-slate-400 mb-1">
                Plan
              </label>
              <select
                name="plan"
                value={formData.plan}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-[#1c273e] border border-slate-200 dark:border-slate-700/80 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-lime-400"
              >
                <option value="1_month">1 Month — ₹{Number(planPrices["1_month"]) || 0}</option>
                <option value="3_month">3 Months — ₹{Number(planPrices["3_month"]) || 0}</option>
                <option value="6_month">6 Months — ₹{Number(planPrices["6_month"]) || 0}</option>
                <option value="1_year">1 Year — ₹{Number(planPrices["1_year"]) || 0}</option>
              </select>
            </div>

            {/* Admission Type: Normal vs Offer */}
            <div className="md:col-span-2">
              <label className="block text-xs uppercase font-bold text-slate-600 dark:text-slate-400 mb-1">
                Admission Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, admissionType: "normal", offerName: "" }))
                  }
                  className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-semibold transition-colors cursor-pointer ${
                    formData.admissionType === "normal"
                      ? "border-lime-400 bg-lime-400/10 text-lime-400"
                      : "border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-[#1c273e] text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Normal Membership
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
                  className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-semibold transition-colors cursor-pointer ${
                    formData.admissionType === "offer"
                      ? "border-blue-500 bg-blue-500/10 text-blue-400"
                      : "border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-[#1c273e] text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Offer Admission
                </button>
              </div>

              {formData.admissionType === "offer" && (
                <div className="mt-2">
                  <label className="block text-xs uppercase font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Select Offer
                  </label>
                  {activeOffers.length === 0 ? (
                    <p className="text-xs text-amber-500">
                      No active offers — create one in Manage Plans.
                    </p>
                  ) : (
                    <select
                      value={formData.offerName}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, offerName: e.target.value }))
                      }
                      className="w-full bg-slate-50 dark:bg-[#1c273e] border border-slate-200 dark:border-slate-700/80 rounded-lg p-2.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500"
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
                  <label className="block text-xs uppercase font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Discount (optional)
                  </label>
                  <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-[#1c273e] overflow-hidden">
                    <span className="px-2.5 text-sm text-slate-500">₹</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      name="discount"
                      value={formData.discount}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full bg-transparent p-2.5 pl-0 text-sm text-slate-700 dark:text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Activities */}
            <div>
              <label className="block text-xs uppercase font-bold text-slate-600 dark:text-slate-400 mb-1">
                Activities (add-ons)
              </label>
              {activityOptions.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No activities set up yet — add some in Manage Plans.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {activityOptions.map((opt) => {
                    const isSelected = formData.activities.includes(opt.name);
                    return (
                      <button
                        key={opt.name}
                        type="button"
                        onClick={() => handleActivityToggle(opt.name)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-lime-500 border-lime-400 text-slate-950 shadow-sm"
                            : "bg-slate-50 dark:bg-[#1c273e] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        {opt.name} — ₹{Number(opt.prices?.[formData.plan]) || 0}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* New Start Date */}
            <div>
              <label className="block text-xs uppercase font-bold text-slate-600 dark:text-slate-400 mb-1">
                New Start Date
              </label>
              <input
                type="date"
                name="newStartDate"
                value={formData.newStartDate}
                onChange={handleChange}
                min={getMinStartDate()}
                required
                className="w-full bg-slate-50 dark:bg-[#1c273e] border border-slate-200 dark:border-slate-700/80 rounded-lg p-3 text-sm text-lime-400 font-semibold focus:outline-none focus:border-lime-400 scheme-dark"
              />
              <p className="text-[10px] text-slate-600 dark:text-slate-500 mt-1">
                Expired: today · Active: day after current expiry
              </p>
            </div>

            {/* New Expiry Date */}
            <div>
              <label className="block text-xs uppercase font-bold text-slate-600 dark:text-slate-500 mb-1">
                New Expiry Date
              </label>
              <input
                type="date"
                name="newExpiryDate"
                value={formData.newExpiryDate}
                readOnly
                className="w-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-lime-400/80 font-semibold cursor-not-allowed outline-none scheme-dark"
              />
            </div>

            {/* Extension Fee */}
            <div>
              <label className="block text-xs uppercase font-bold text-slate-600 dark:text-slate-400 mb-1">
                New Membership Fee (auto)
              </label>
              <input
                type="text"
                name="extensionAmount"
                value={`₹${formData.extensionAmount || 0}`}
                readOnly
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-lg p-3 text-sm text-slate-600 dark:text-slate-300 cursor-not-allowed"
              />
              {Number(formData.extensionAmount) === 0 && (
                <p className="text-[10px] text-amber-500 mt-1">
                  Set a price for this plan in Manage Plans (Profile page).
                </p>
              )}
            </div>

            {/* Amount Paid */}
            <div>
              <label className="block text-xs uppercase font-bold text-slate-600 dark:text-slate-400 mb-1">
                Amount Paying Today
              </label>
              <input
                type="number"
                name="amountPayingToday"
                value={formData.amountPayingToday}
                onChange={handleChange}
                min="0"
                max={formData.extensionAmount || 0}
                required
                placeholder="Enter payment"
                className="w-full bg-slate-50 dark:bg-[#1c273e] border border-slate-200 dark:border-slate-700/80 rounded-lg p-3 text-sm text-emerald-400 font-bold placeholder-slate-500 focus:outline-none focus:border-lime-400"
              />
            </div>

            {/* Balance */}
            <div>
              <label className="block text-xs uppercase font-bold text-slate-600 dark:text-slate-400 mb-1">
                Balance Amount
              </label>
              <input
                type="number"
                name="balanceAmount"
                value={formData.balanceAmount}
                readOnly
                className="w-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-rose-400 font-bold cursor-not-allowed outline-none"
              />
              <p className="text-[10px] text-slate-600 dark:text-slate-500 mt-1">
                Auto-calculated: Fee − Paid
              </p>
            </div>

            {/* Payment Mode */}
            <div className="md:col-span-2">
              <label className="block text-xs uppercase font-bold text-slate-600 dark:text-slate-400 mb-1">
                Payment Mode
              </label>
              <select
                name="paymentMode"
                value={formData.paymentMode}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-[#1c273e] border border-slate-200 dark:border-slate-700/80 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-lime-400"
              >
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider p-3 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-lime-500 hover:bg-lime-400 text-slate-950 text-xs font-bold uppercase tracking-wider p-3 rounded-xl transition-colors cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Renewing...
                </>
              ) : (
                "Confirm"
              )}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  ), document.body);
}