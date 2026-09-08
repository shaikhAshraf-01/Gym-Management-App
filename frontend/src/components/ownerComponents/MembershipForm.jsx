import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

// Hardcoded for now — becomes a per-gym manageable list later if needed.
const ACTIVITY_OPTIONS = [
  { value: "workout", label: "Workout" },
  { value: "cardio", label: "Cardio" },
  { value: "zumba", label: "Zumba" },
  { value: "hiit", label: "HIIT" },
];

export default function MembershipForm({ onSave, onCancel, prefill }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  });

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
    const { name, value } = e.target;

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

      // If Plan Amount is reduced,
      // reduce Amount Paying Today automatically
      if (name === "planAmount") {
        const newPlan = parseFloat(value) || 0;
        const currentPaid =
          parseFloat(prev.amountPayingToday) || 0;

        return {
          ...prev,
          planAmount: value,
          amountPayingToday:
            currentPaid > newPlan
              ? String(newPlan)
              : prev.amountPayingToday,
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
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-full min-h-0 w-full flex-col overflow-hidden text-slate-200"
    >
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4">
        <h2 className="text-base font-bold text-white mb-4 uppercase tracking-wider border-b border-slate-800 pb-2">
          New Membership Form
        </h2>
      </div>

      {/* SCROLLABLE FORM AREA */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 overscroll-contain">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Name */}
          <div className="md:col-span-2">
            <label className="block text-xs uppercase font-bold text-slate-500 mb-1">
              Full Client Name
            </label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-cyan-500"
              placeholder="John Doe"
              required
            />
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-xs uppercase font-bold text-slate-500 mb-1">
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
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-cyan-500"
              placeholder="e.g. 9876543210"
              required
            />
          </div>

          {/* Age + Gender — side by side, even on mobile */}
          <div className="grid grid-cols-2 gap-4 md:col-span-2">
            <div>
              <label className="block text-xs uppercase font-bold text-slate-500 mb-1">
                Age
              </label>

              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="no-spinner w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                placeholder="24"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-bold text-slate-500 mb-1">
                Gender
              </label>

              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-cyan-500"
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
            <label className="block text-xs uppercase font-bold text-slate-500 mb-1">
              Select Plan Option
            </label>

            <select
              name="plan"
              value={formData.plan}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="1_month">
                1 Month
              </option>

              <option value="3_month">
                3 Months
              </option>

              <option value="6_month">
                6 Months
              </option>

              <option value="1_year">
                1 Year
              </option>
            </select>
          </div>

          {/* Activities */}
          <div className="md:col-span-2">
            <label className="block text-xs uppercase font-bold text-slate-500 mb-1">
              Activities
            </label>

            <div className="flex flex-wrap gap-2">
              {ACTIVITY_OPTIONS.map((opt) => {
                const isSelected = formData.activities.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleActivityToggle(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Joining Date */}
          <div>
            <label className="block text-xs uppercase font-bold text-slate-500 mb-1">
              Joining Date
            </label>

            <input
              type="date"
              name="joiningDate"
              value={formData.joiningDate}
              onChange={handleChange}
              min={getMinJoiningDate()}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-cyan-500"
              required
            />

            <p className="text-[10px] text-gray-400 mt-1">
              Up to 6 months back, or any date onwards
            </p>
          </div>

          {/* Plan Amount */}
          <div>
            <label className="block text-xs uppercase font-bold text-slate-500 mb-1">
              Plan Amount
            </label>

            <input
              type="number"
              name="planAmount"
              value={formData.planAmount}
              onChange={handleChange}
              min="0"
              className="no-spinner w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-cyan-500"
              placeholder="Enter total package price"
              required
            />
          </div>

          {/* Amount Paying Today */}
          <div>
            <label className="block text-xs uppercase font-bold text-slate-500 mb-1">
              Amount Paying Today
            </label>

            <input
              type="number"
              name="amountPayingToday"
              value={formData.amountPayingToday}
              onChange={handleChange}
              min="0"
              max={formData.planAmount || undefined}
              className="no-spinner w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-emerald-400 font-bold focus:outline-none focus:border-cyan-500"
              placeholder="Enter collected payment"
              required
            />
          </div>

          {/* Balance */}
          <div>
            <label className="block text-xs uppercase font-bold text-slate-500 mb-1">
              Balance Amount
            </label>

            <input
              type="number"
              name="balanceAmount"
              value={calculatedBalance}
              readOnly
              className="no-spinner w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-sm text-red-400 font-bold cursor-not-allowed outline-none"
              placeholder="Calculated automatically"
            />
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-xs uppercase font-bold text-slate-500 mb-1">
              Payment Mode
            </label>

            <select
              name="paymentMode"
              value={formData.paymentMode}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="upi">
                UPI
              </option>

              <option value="cash">
                Cash
              </option>

              <option value="both">
                Both (UPI + Cash)
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
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-sm text-cyan-400 font-semibold cursor-not-allowed outline-none"
            />
          </div>

        </div>
        <div className="border-t border-slate-800 bg-slate-900/90 py-4">
        <div className="flex flex-row gap-2 sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-800 p-3 text-sm font-semibold uppercase tracking-wider text-slate-300 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 sm:max-w-xs"
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