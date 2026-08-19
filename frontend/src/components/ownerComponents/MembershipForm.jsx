import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function MembershipForm({ onSave, prefill }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: prefill?.name || "",
    mobile: prefill?.mobile || "",
    age: "",
    plan: "1_month",
    planAmount: "",
    amountPayingToday: "",
    paymentMode: "upi",
    joiningDate: new Date().toISOString().split("T")[0],
    remainingPayingDate: "",
  });

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
    if (
      calculatedBalance > 0 &&
      !formData.remainingPayingDate
    ) {
      alert("Please select the remaining payment date.");
      return;
    }

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
        plan: "1_month",
        planAmount: "",
        amountPayingToday: "",
        paymentMode: "upi",
        joiningDate: new Date()
          .toISOString()
          .split("T")[0],
        remainingPayingDate: "",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full h-full flex flex-col text-gray-900"
    >
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4">
        <h2 className="text-base font-bold text-gray-900 mb-4 uppercase tracking-wider border-b border-gray-100 pb-2">
          New Membership Form
        </h2>
      </div>

      {/* SCROLLABLE FORM AREA */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Name */}
          <div className="md:col-span-2">
            <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
              Full Client Name
            </label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
              placeholder="John Doe"
              required
            />
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
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
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
              placeholder="e.g. 9876543210"
              required
            />
          </div>

          {/* Age */}
          <div>
            <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
              Age
            </label>

            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className="no-spinner w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
              placeholder="24"
            />
          </div>

          {/* Plan */}
          <div>
            <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
              Select Plan Option
            </label>

            <select
              name="plan"
              value={formData.plan}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
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

          {/* Joining Date */}
          <div>
            <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
              Joining Date
            </label>

            <input
              type="date"
              name="joiningDate"
              value={formData.joiningDate}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Plan Amount */}
          <div>
            <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
              Plan Amount
            </label>

            <input
              type="number"
              name="planAmount"
              value={formData.planAmount}
              onChange={handleChange}
              min="0"
              className="no-spinner w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
              placeholder="Enter total package price"
              required
            />
          </div>

          {/* Amount Paying Today */}
          <div>
            <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
              Amount Paying Today
            </label>

            <input
              type="number"
              name="amountPayingToday"
              value={formData.amountPayingToday}
              onChange={handleChange}
              min="0"
              max={formData.planAmount || undefined}
              className="no-spinner w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-emerald-600 font-bold focus:outline-none focus:border-blue-500"
              placeholder="Enter collected payment"
              required
            />
          </div>

          {/* Balance */}
          <div>
            <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
              Balance Amount
            </label>

            <input
              type="number"
              name="balanceAmount"
              value={calculatedBalance}
              readOnly
              className="no-spinner w-full bg-gray-100 border border-gray-200 rounded-lg p-3 text-sm text-red-500 font-bold cursor-not-allowed outline-none"
              placeholder="Calculated automatically"
            />
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
              Payment Mode
            </label>

            <select
              name="paymentMode"
              value={formData.paymentMode}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
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

          {/* Remaining Payment Date */}
          {calculatedBalance > 0 && (
            <div>
              <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
                Remaining Paying Date
              </label>

              <input
                type="date"
                name="remainingPayingDate"
                value={formData.remainingPayingDate}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          )}

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
              className="w-full bg-gray-100 border border-gray-200 rounded-lg p-3 text-sm text-blue-600 font-semibold cursor-not-allowed outline-none"
            />
          </div>

        </div>
      <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white text-sm font-semibold uppercase tracking-wider p-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Client Membership"
          )}
        </button>
      </div>
      </div>

      {/* FIXED BUTTON AREA */}

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