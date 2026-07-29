import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function ExtendMembershipModal({ member, addedBy, onSave, onClose }) {
  const [formData, setFormData] = useState({
    plan: "1_month",
    extensionAmount: "",
    amountPayingToday: "",
    balanceAmount: "",
    paymentMode: "upi",
    newExpiryDate: "",
  });

  // Whenever a new member is selected for extension, reset the form
  // and seed the balance with whatever they currently owe.
  useEffect(() => {
    if (member) {
      setFormData({
        plan: member.plan || "1_month",
        extensionAmount: "",
        amountPayingToday: "",
        balanceAmount: member.balanceAmount || "0",
        paymentMode: member.paymentMode || "upi",
        newExpiryDate: "",
      });
    }
  }, [member]);

  // 📅 Auto-calculate the new expiry date for DISPLAY only — the slice's
  // extendMembership reducer recomputes this itself authoritatively
  // using the same formula, so this preview always matches what gets saved.
  useEffect(() => {
    if (!member) return;

    let monthsToAdd = 1;
    if (formData.plan === "3_month") monthsToAdd = 3;
    if (formData.plan === "6_month") monthsToAdd = 6;
    if (formData.plan === "1_year") monthsToAdd = 12;

    const today = new Date();
    const currentExpiry = member.expiryDate ? new Date(member.expiryDate) : today;
    const startFrom = currentExpiry > today ? currentExpiry : today;

    const newExpiry = new Date(startFrom);
    newExpiry.setMonth(newExpiry.getMonth() + monthsToAdd);

    const year = newExpiry.getFullYear();
    const monthStr = String(newExpiry.getMonth() + 1).padStart(2, "0");
    const day = String(newExpiry.getDate()).padStart(2, "0");

    setFormData((prev) => ({
      ...prev,
      newExpiryDate: `${year}-${monthStr}-${day}`,
    }));
  }, [formData.plan, member]);

  if (!member) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Send the raw extension details — membersSlice's extendMembership
    // reducer handles merging amounts, computing the authoritative new
    // expiry, and appending the membershipHistory entry.
    onSave(member.id, {
      plan: formData.plan,
      extensionAmount: formData.extensionAmount,
      amountPayingToday: formData.amountPayingToday,
      balanceAmount: formData.balanceAmount,
      paymentMode: formData.paymentMode,
      addedBy,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-bold text-gray-900 uppercase tracking-wider">
              Extend Membership
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">{member.name} · {member.mobile}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold text-gray-500 mb-1">Extend By</label>
              <select
                name="plan" value={formData.plan} onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
              >
                <option value="1_month">1 Month</option>
                <option value="3_month">3 Months</option>
                <option value="6_month">6 Months</option>
                <option value="1_year">1 Year</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase font-bold text-gray-400 mb-1">New Expiry Date</label>
              <input
                type="date" name="newExpiryDate" value={formData.newExpiryDate} readOnly
                className="w-full bg-gray-100 border border-gray-200 rounded-lg p-3 text-sm text-blue-600 font-semibold cursor-not-allowed outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs uppercase font-bold text-gray-500 mb-1">Extension Fee</label>
              <input
                type="number" name="extensionAmount" value={formData.extensionAmount} onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                placeholder="Amount charged for this extension" required
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-bold text-gray-500 mb-1">Amount Paying Today</label>
              <input
                type="number" name="amountPayingToday" value={formData.amountPayingToday} onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-emerald-600 font-bold focus:outline-none focus:border-blue-500"
                placeholder="Enter collected payment" required
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-bold text-gray-500 mb-1">Balance Amount</label>
              <input
                type="number" name="balanceAmount" value={formData.balanceAmount} onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-red-500 font-bold focus:outline-none focus:border-blue-500"
                placeholder="Enter remaining balance" required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs uppercase font-bold text-gray-500 mb-1">Payment Mode</label>
              <select
                name="paymentMode" value={formData.paymentMode} onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
              >
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
                <option value="both">Both (UPI + Cash)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold uppercase tracking-wider p-3 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold uppercase tracking-wider p-3 rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              Confirm Extension
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}