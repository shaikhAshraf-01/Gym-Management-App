import React, { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";

export default function ExtendMembershipModal({
  member,
  onSave,
  onClose,
}) {
  // Same reasoning as MembershipForm.jsx — the Confirm button gave no
  // feedback while extendMembership was in flight (~1.5-2.5s), so it
  // looked stuck/unresponsive until the modal suddenly closed.
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    plan: "1_month",
    extensionAmount: "",
    amountPayingToday: "",
    balanceAmount: "0",
    balanceDueDate: "",
    paymentMode: "upi",
    newStartDate: "",
    newExpiryDate: "",
  });

  // ---------------------------------------------------------------
  // Format Date -> YYYY-MM-DD
  // ---------------------------------------------------------------
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // ---------------------------------------------------------------
  // Calculate default Start Date
  //
  // Expired:
  //     Start = today
  //
  // Active:
  //     Start = current expiry + 1 day
  // ---------------------------------------------------------------
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

  // ---------------------------------------------------------------
  // Earliest allowed New Start Date — capped to 6 months back from
  // today, so owners can't accidentally backdate a renewal further
  // than that.
  // ---------------------------------------------------------------
  const getMinStartDate = () => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setHours(0, 0, 0, 0);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    return formatDate(sixMonthsAgo);
  };

  // ---------------------------------------------------------------
  // Calculate Expiry Date from selected Start Date + Plan
  // ---------------------------------------------------------------
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

    // Add T12:00 to avoid timezone-related date shifting
    const startDate = new Date(
      `${formData.newStartDate}T12:00:00`
    );

    const expiryDate = new Date(startDate);

    expiryDate.setMonth(
      expiryDate.getMonth() + monthsToAdd
    );

    setFormData((prev) => ({
      ...prev,
      newExpiryDate: formatDate(expiryDate),
      // If a previously-picked balance due date now falls outside the
      // new [today, expiry] window, clear it so a stale/out-of-range
      // date can't silently be submitted.
      balanceDueDate:
        prev.balanceDueDate &&
        prev.balanceDueDate > formatDate(expiryDate)
          ? ""
          : prev.balanceDueDate,
    }));
  }, [formData.plan, formData.newStartDate, member]);

  // ---------------------------------------------------------------
  // Auto-calculate Balance Amount
  //
  // Balance = New Membership Fee − Amount Paying Today, floored at 0.
  // No manual entry — this stays in sync automatically whenever
  // either of those two fields changes, so it can't drift out of
  // sync the way a manually-typed balance could.
  // ---------------------------------------------------------------
  useEffect(() => {
    const fee = Number(formData.extensionAmount) || 0;
    const paid = Number(formData.amountPayingToday) || 0;
    const balance = Math.max(0, fee - paid);

    setFormData((prev) => ({
      ...prev,
      balanceAmount: String(balance),
      // No balance left to collect -> no due date needed.
      balanceDueDate: balance === 0 ? "" : prev.balanceDueDate,
    }));
  }, [formData.extensionAmount, formData.amountPayingToday]);

  // ---------------------------------------------------------------
  // Reset modal when member changes
  // ---------------------------------------------------------------
  useEffect(() => {
    if (!member) return;

    setFormData({
      plan: member.plan || "1_month",
      extensionAmount: "",
      amountPayingToday: "",
      balanceAmount: "0",
      balanceDueDate: "",
      paymentMode: member.paymentMode || "upi",
      newStartDate: calculateDefaultStartDate(),
      newExpiryDate: "",
    });
  }, [member]);

  if (!member) return null;

  // ---------------------------------------------------------------
  // Input change
  // ---------------------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      // Amount Paying Today can never exceed the membership fee.
      // Clamp live as the user types.
      if (name === "amountPayingToday") {
        const fee = Number(prev.extensionAmount) || 0;
        const paid = Number(value) || 0;

        // Don't force-clamp to 0 before a fee has been entered yet —
        // only clamp once a real fee exists.
        return {
          ...prev,
          amountPayingToday: fee > 0 ? String(Math.min(paid, fee)) : value,
        };
      }

      // If the membership fee itself is lowered (or changed) after an
      // amount was already entered, re-clamp the paid amount so it
      // can never sit above the new fee.
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

  // ---------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSave(member.id, {
        plan: formData.plan,
        extensionAmount: formData.extensionAmount,
        amountPayingToday: formData.amountPayingToday,
        balanceAmount: formData.balanceAmount,
        balanceDueDate: formData.balanceDueDate,
        paymentMode: formData.paymentMode,

        // IMPORTANT:
        // Send the selected start date to backend.
        newStartDate: formData.newStartDate,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasBalance = Number(formData.balanceAmount) > 0;
  const todayStr = formatDate(new Date());

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-bold text-gray-900 uppercase tracking-wider">
              Renew Membership
            </h2>

            <p className="text-xs text-gray-500 mt-0.5">
              {member.name} · {member.mobile}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg cursor-pointer transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-4 md:p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Plan */}
            <div>
              <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
                Renew For
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

            {/* New Start Date */}
            <div>
              <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
                New Start Date
              </label>

              <input
                type="date"
                name="newStartDate"
                value={formData.newStartDate}
                onChange={handleChange}
                min={getMinStartDate()}
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-blue-600 font-semibold focus:outline-none focus:border-blue-500"
              />

              <p className="text-[10px] text-gray-400 mt-1">
                Expired: today · Active: day after current expiry · up to 6 months back
              </p>
            </div>

            {/* New Expiry Date */}
            <div>
              <label className="block text-xs uppercase font-bold text-gray-400 mb-1">
                New Expiry Date
              </label>

              <input
                type="date"
                name="newExpiryDate"
                value={formData.newExpiryDate}
                readOnly
                className="w-full bg-gray-100 border border-gray-200 rounded-lg p-3 text-sm text-blue-600 font-semibold cursor-not-allowed outline-none"
              />
            </div>

            {/* Extension Fee */}
            <div>
              <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
                New Membership Fee
              </label>

              <input
                type="number"
                name="extensionAmount"
                value={formData.extensionAmount}
                onChange={handleChange}
                min="0"
                required
                placeholder="Enter new membership fee"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Amount Paid */}
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
                max={formData.extensionAmount||0}
                required
                placeholder="Enter collected payment"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-emerald-600 font-bold focus:outline-none focus:border-blue-500"
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
                value={formData.balanceAmount}
                readOnly
                className="w-full bg-gray-100 border border-gray-200 rounded-lg p-3 text-sm text-red-500 font-bold cursor-not-allowed outline-none"
              />

              <p className="text-[10px] text-gray-400 mt-1">
                Auto-calculated: Fee − Amount Paid
              </p>
            </div>

            {/* Balance Due Date — only meaningful while a balance is
                actually outstanding, and must fall somewhere between
                today and the new expiry date. */}
            <div>
              <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
                Balance Due Date
              </label>

              <input
                type="date"
                name="balanceDueDate"
                value={formData.balanceDueDate}
                onChange={handleChange}
                min={todayStr}
                max={formData.newExpiryDate || undefined}
                disabled={!hasBalance}
                required={hasBalance}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-red-500 font-semibold focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              />

              <p className="text-[10px] text-gray-400 mt-1">
                {hasBalance
                  ? "Must fall between today and the new expiry date"
                  : "No balance pending — nothing to collect"}
              </p>
            </div>

            {/* Payment Mode */}
            <div className="md:col-span-2">
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
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-6">

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold uppercase tracking-wider p-3 rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold uppercase tracking-wider p-3 rounded-lg transition-colors cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Renewing...
                </>
              ) : (
                "Confirm Extension"
              )}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}