import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";

const ACTIVITY_OPTIONS = [
  { value: "workout", label: "Workout" },
  { value: "cardio", label: "Cardio" },
  { value: "zumba", label: "Zumba" },
  { value: "hiit", label: "HIIT" },
];

export default function ExtendMembershipModal({
  member,
  onSave,
  onClose,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    plan: "1_month",
    activities: [],
    extensionAmount: "",
    amountPayingToday: "",
    balanceAmount: "0",
    paymentMode: "upi",
    newStartDate: "",
    newExpiryDate: "",
  });

  const handleNumberKeyDown = (e) => {
    const allowedKeys = [
      "Backspace",
      "Tab",
      "Enter",
      "Escape",
      "ArrowLeft",
      "ArrowRight",
      "Delete",
    ];

    if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
      return;
    }

    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleNumberPaste = (e) => {
    const pastedData = e.clipboardData.getData("text");
    if (!/^\d+$/.test(pastedData)) {
      e.preventDefault();
    }
  };

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
      paymentMode: member.paymentMode === "both" ? "cash" : member.paymentMode || "upi",
      newStartDate: calculateDefaultStartDate(),
      newExpiryDate: "",
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
    if (["extensionAmount", "amountPayingToday", "balanceAmount"].includes(name)) {
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

      if (name === "extensionAmount") {
        const newFee = Number(value) || 0;
        const currentPaid = Number(prev.amountPayingToday) || 0;

        return {
          ...prev,
          extensionAmount: value,
          amountPayingToday:
            currentPaid > newFee ? String(newFee) : prev.amountPayingToday,
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
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal((
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/70 p-3 backdrop-blur-sm [touch-action:pan-y] sm:p-4">
      <div className="flex min-h-full items-start justify-center sm:items-center">
      <div className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-800 bg-[#131b2e] text-slate-100 shadow-2xl sm:max-h-[calc(100dvh-2rem)]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 sticky top-0 bg-[#131b2e] z-10">
          <div>
            <h2 className="text-base font-extrabold text-lime-400 uppercase tracking-wider">
              Membership Detail
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {member.name} · {member.mobile}
            </p>
          </div>

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
              <label className="block text-xs uppercase font-bold text-slate-400 mb-1">
                Plan
              </label>
              <select
                name="plan"
                value={formData.plan}
                onChange={handleChange}
                className="w-full bg-[#1c273e] border border-slate-700/80 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-lime-400"
              >
                <option value="1_month">1 Month</option>
                <option value="3_month">3 Months</option>
                <option value="6_month">6 Months</option>
                <option value="1_year">1 Year</option>
              </select>
            </div>

            {/* Activities */}
            <div>
              <label className="block text-xs uppercase font-bold text-slate-400 mb-1">
                Activities
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ACTIVITY_OPTIONS.map((opt) => {
                  const isSelected = formData.activities.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleActivityToggle(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-lime-500 border-lime-400 text-slate-950 shadow-sm"
                          : "bg-[#1c273e] border-slate-700 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* New Start Date */}
            <div>
              <label className="block text-xs uppercase font-bold text-slate-400 mb-1">
                New Start Date
              </label>
              <input
                type="date"
                name="newStartDate"
                value={formData.newStartDate}
                onChange={handleChange}
                min={getMinStartDate()}
                required
                className="w-full bg-[#1c273e] border border-slate-700/80 rounded-lg p-3 text-sm text-lime-400 font-semibold focus:outline-none focus:border-lime-400 scheme-dark"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Expired: today · Active: day after current expiry
              </p>
            </div>

            {/* New Expiry Date */}
            <div>
              <label className="block text-xs uppercase font-bold text-slate-500 mb-1">
                New Expiry Date
              </label>
              <input
                type="date"
                name="newExpiryDate"
                value={formData.newExpiryDate}
                readOnly
                className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-sm text-lime-400/80 font-semibold cursor-not-allowed outline-none scheme-dark"
              />
            </div>

            {/* Extension Fee */}
            <div>
              <label className="block text-xs uppercase font-bold text-slate-400 mb-1">
                New Membership Fee
              </label>
              <input
                type="text"
                inputMode="numeric"
                name="extensionAmount"
                value={formData.extensionAmount}
                onChange={handleChange}
                onKeyDown={handleNumberKeyDown}
                onPaste={handleNumberPaste}
                required
                placeholder="Enter new fee"
                className="w-full bg-[#1c273e] border border-slate-700/80 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-lime-400"
              />
            </div>

            {/* Amount Paid */}
            <div>
              <label className="block text-xs uppercase font-bold text-slate-400 mb-1">
                Amount Paying Today
              </label>
              <input
                type="text"
                inputMode="numeric"
                name="amountPayingToday"
                value={formData.amountPayingToday}
                onChange={handleChange}
                onKeyDown={handleNumberKeyDown}
                onPaste={handleNumberPaste}
                required
                placeholder="Enter payment"
                className="w-full bg-[#1c273e] border border-slate-700/80 rounded-lg p-3 text-sm text-emerald-400 font-bold placeholder-slate-500 focus:outline-none focus:border-lime-400"
              />
            </div>

            {/* Balance */}
            <div>
              <label className="block text-xs uppercase font-bold text-slate-400 mb-1">
                Balance Amount
              </label>
              <input
                type="text"
                inputMode="numeric"
                name="balanceAmount"
                value={formData.balanceAmount}
                readOnly
                className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-sm text-rose-400 font-bold cursor-not-allowed outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Auto-calculated: Fee − Paid
              </p>
            </div>

            {/* Payment Mode */}
            <div className="md:col-span-2">
              <label className="block text-xs uppercase font-bold text-slate-400 mb-1">
                Payment Mode
              </label>
              <select
                name="paymentMode"
                value={formData.paymentMode}
                onChange={handleChange}
                className="w-full bg-[#1c273e] border border-slate-700/80 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-lime-400"
              >
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider p-3 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
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