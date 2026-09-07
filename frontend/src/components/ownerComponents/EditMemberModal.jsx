import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";

const ACTIVITY_OPTIONS = [
  { value: "workout", label: "Workout" },
  { value: "cardio", label: "Cardio" },
  { value: "zumba", label: "Zumba" },
  { value: "hiit", label: "HIIT" },
];

export default function EditMemberModal({ member, onSave, onClose }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    age: "",
    gender: "",
    activities: [],
    plan: "1_month",
    planAmount: "",
    amountPayingToday: "",
    balanceAmount: "",
    paymentMode: "upi",
    joiningDate: "",
    expiryDate: "",
  });

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

  useEffect(() => {
    if (member) {
      const planAmount = Number(member.latestPlanAmount || 0);

      const paidAmount = Math.min(
        Number(member.latestAmountPaid || 0),
        planAmount
      );

      setFormData({
        name: member.name || "",
        mobile: member.mobile || "",
        age: member.age || "",
        gender: member.gender || "",
        activities: member.activities || [],
        plan: member.plan || "1_month",

        planAmount: String(planAmount),
        amountPayingToday: String(paidAmount),
        balanceAmount: String(
          Math.max(0, planAmount - paidAmount)
        ),

        paymentMode: member.paymentMode || "upi",
        joiningDate: member.joiningDate || "",
        expiryDate: member.expiryDate || "",
      });
    }
  }, [member]);

  if (!member) return null;

  const getMinJoiningDate = () => {
    const sixMonthsAgo = new Date();

    sixMonthsAgo.setHours(0, 0, 0, 0);
    sixMonthsAgo.setMonth(
      sixMonthsAgo.getMonth() - 6
    );

    return sixMonthsAgo.toISOString().split("T")[0];
  };

  const calculateExpiryDate = (joiningDate, plan) => {
    if (!joiningDate) return "";

    const [year, month, day] = joiningDate
      .split("-")
      .map(Number);

    const date = new Date(
      year,
      month - 1,
      day
    );

    switch (plan) {
      case "1_month":
        date.setMonth(date.getMonth() + 1);
        break;

      case "3_month":
        date.setMonth(date.getMonth() + 3);
        break;

      case "6_month":
        date.setMonth(date.getMonth() + 6);
        break;

      case "1_year":
        date.setFullYear(date.getFullYear() + 1);
        break;

      default:
        return "";
    }

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };

      if (name === "joiningDate" || name === "plan") {
        updated.expiryDate = calculateExpiryDate(
          name === "joiningDate"
            ? value
            : prev.joiningDate,
          name === "plan"
            ? value
            : prev.plan
        );
      }

      if (name === "planAmount") {
        const planAmount = Math.max(
          0,
          Number(value) || 0
        );

        const currentPaid =
          Number(prev.amountPayingToday) || 0;

        const safePaid = Math.min(
          currentPaid,
          planAmount
        );

        updated.planAmount = String(planAmount);
        updated.amountPayingToday = String(safePaid);
        updated.balanceAmount = String(
          planAmount - safePaid
        );
      }

      if (name === "amountPayingToday") {
        const planAmount = Math.max(
          0,
          Number(prev.planAmount) || 0
        );

        const requestedPaid = Math.max(
          0,
          Number(value) || 0
        );

        const safePaid = Math.min(
          requestedPaid,
          planAmount
        );

        updated.amountPayingToday = String(
          safePaid
        );

        updated.balanceAmount = String(
          Math.max(0, planAmount - safePaid)
        );
      }

      return updated;
    });
  };

  const handleBalanceChange = (e) => {
    const value = e.target.value;

    setFormData((prev) => {
      const planAmount = Math.max(
        0,
        Number(prev.planAmount) || 0
      );

      let newBalance = Math.max(
        0,
        Number(value) || 0
      );

      newBalance = Math.min(
        newBalance,
        planAmount
      );

      const newPaid = Math.max(
        0,
        planAmount - newBalance
      );

      return {
        ...prev,
        balanceAmount: String(newBalance),
        amountPayingToday: String(
          Math.min(newPaid, planAmount)
        ),
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    const planAmount = Math.max(
      0,
      Number(formData.planAmount) || 0
    );

    const paidAmount = Math.min(
      Math.max(
        0,
        Number(formData.amountPayingToday) || 0
      ),
      planAmount
    );

    const balanceAmount = Math.max(
      0,
      planAmount - paidAmount
    );

    const finalData = {
      ...formData,
      planAmount: String(planAmount),
      amountPayingToday: String(paidAmount),
      balanceAmount: String(balanceAmount),
    };

    setIsSubmitting(true);

    try {
      await onSave(member.id, finalData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all";

  const labelClass =
    "block text-xs uppercase font-bold tracking-wider text-zinc-400 mb-1.5";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">

      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/50 w-full max-w-lg max-h-[85vh] overflow-y-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-zinc-800 sticky top-0 bg-zinc-950 z-10">

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500 mb-1">
              Member Management
            </p>

            <h2 className="text-lg font-black text-white uppercase tracking-wider">
              Edit Member
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 bg-red-950/50 hover:bg-red-900/70 text-red-500 hover:text-red-400 border border-red-900/50 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="p-4 md:p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* NAME */}
            <div className="md:col-span-2">
              <label className={labelClass}>
                Full Client Name
              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>

            {/* MOBILE */}
            <div>
              <label className={labelClass}>
                Mobile Number
              </label>

              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>

            {/* AGE + GENDER */}
            <div className="grid grid-cols-2 gap-4 md:col-span-2">

              <div>
                <label className={labelClass}>
                  Age
                </label>

                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Gender
                </label>

                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">
                    Female
                  </option>
                  <option value="Other">
                    Other
                  </option>
                </select>
              </div>

            </div>

            {/* ACTIVITIES */}
            <div>
              <label className={labelClass}>
                Activities
              </label>

              <div className="flex flex-wrap gap-2">

                {ACTIVITY_OPTIONS.map((opt) => {
                  const isSelected =
                    formData.activities.includes(
                      opt.value
                    );

                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        handleActivityToggle(
                          opt.value
                        )
                      }
                      className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20"
                          : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-red-500 hover:text-white"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}

              </div>
            </div>

            {/* PLAN */}
            <div>
              <label className={labelClass}>
                Select Plan
              </label>

              <select
                name="plan"
                value={formData.plan}
                onChange={handleChange}
                className={inputClass}
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

            {/* JOINING DATE */}
            <div>
              <label className={labelClass}>
                Joining Date
              </label>

              <input
                type="date"
                name="joiningDate"
                value={formData.joiningDate}
                onChange={handleChange}
                min={getMinJoiningDate()}
                className={inputClass}
                required
              />

              <p className="text-[10px] text-zinc-600 mt-1">
                Up to 6 months back, or any date onwards
              </p>
            </div>

            {/* EXPIRY DATE */}
            <div>
              <label className={labelClass}>
                Expiry Date
              </label>

              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                className={`${inputClass} text-red-400 font-semibold`}
                required
              />
            </div>

            {/* PLAN AMOUNT */}
            <div>
              <label className={labelClass}>
                This Period's Plan Amount
              </label>

              <input
                type="number"
                name="planAmount"
                min="0"
                value={formData.planAmount}
                onChange={handleChange}
                className={inputClass}
                required
              />

              <p className="text-[10px] text-zinc-600 mt-1">
                Current plan fee only
              </p>
            </div>

            {/* AMOUNT PAID */}
            <div>
              <label className={labelClass}>
                This Period's Amount Paid
              </label>

              <input
                type="number"
                name="amountPayingToday"
                min="0"
                max={formData.planAmount || 0}
                value={formData.amountPayingToday}
                onChange={handleChange}
                className={`${inputClass} text-emerald-400 font-bold`}
              />

              <p className="text-[10px] text-zinc-600 mt-1">
                Cannot exceed plan amount
              </p>
            </div>

            {/* BALANCE */}
            <div>
              <label className={labelClass}>
                Balance Amount
              </label>

              <input
                type="number"
                name="balanceAmount"
                min="0"
                max={formData.planAmount || 0}
                value={formData.balanceAmount}
                onChange={handleBalanceChange}
                className={`${inputClass} text-red-400 font-bold`}
                required
              />

              <p className="text-[10px] text-zinc-600 mt-1">
                Plan Amount − Amount Paid
              </p>
            </div>

            {/* PAYMENT MODE */}
            <div>
              <label className={labelClass}>
                Payment Mode
              </label>

              <select
                name="paymentMode"
                value={formData.paymentMode}
                onChange={handleChange}
                className={inputClass}
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

          </div>

          {/* BUTTONS */}
          <div className="flex gap-3 mt-6 pt-5 border-t border-zinc-800">

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm font-bold uppercase tracking-wider p-3 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold uppercase tracking-wider p-3 rounded-lg transition-all cursor-pointer shadow-lg shadow-red-600/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}