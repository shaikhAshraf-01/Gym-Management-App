import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function EditMemberModal({ member, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    age: "",
    plan: "1_month",
    planAmount: "",
    amountPayingToday: "",
    balanceAmount: "",
    balanceUpdateDate: "",
    paymentMode: "upi",
    joiningDate: "",
    expiryDate: "",
  });

  // ------------------------------------------------------------
  // LOAD MEMBER DATA
  // ------------------------------------------------------------
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
        plan: member.plan || "1_month",

        planAmount: String(planAmount),
        amountPayingToday: String(paidAmount),

        balanceAmount: String(
          Math.max(0, planAmount - paidAmount)
        ),

        balanceUpdateDate: member.balanceUpdateDate || "",
        paymentMode: member.paymentMode || "upi",
        joiningDate: member.joiningDate || "",
        expiryDate: member.expiryDate || "",
      });
    }
  }, [member]);

  if (!member) return null;

  // ------------------------------------------------------------
  // CALCULATE EXPIRY DATE
  // ------------------------------------------------------------
  const calculateExpiryDate = (joiningDate, plan) => {
    if (!joiningDate) return "";

    const [year, month, day] = joiningDate
      .split("-")
      .map(Number);

    const date = new Date(year, month - 1, day);

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

  // ------------------------------------------------------------
  // GENERAL INPUT HANDLER
  // ------------------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };

      // Joining date or plan changes -> recalculate expiry
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

      // --------------------------------------------------------
      // PLAN AMOUNT CHANGED
      // --------------------------------------------------------
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

      // --------------------------------------------------------
      // AMOUNT PAID CHANGED
      // --------------------------------------------------------
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

  // ------------------------------------------------------------
  // BALANCE HANDLER
  // ------------------------------------------------------------
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

        balanceUpdateDate:
          new Date()
            .toISOString()
            .split("T")[0],
      };
    });
  };

  // ------------------------------------------------------------
  // SUBMIT
  // ------------------------------------------------------------
  const handleSubmit = (e) => {
    e.preventDefault();

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

    onSave(member.id, finalData);
  };

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold text-gray-900 uppercase tracking-wider">
            Edit Member
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
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
              <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
                Full Client Name
              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            {/* MOBILE */}
            <div>
              <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
                Mobile Number
              </label>

              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            {/* AGE */}
            <div>
              <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
                Age
              </label>

              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* PLAN */}
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

            {/* JOINING DATE */}
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

            {/* EXPIRY DATE */}
            <div>
              <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
                Expiry Date
              </label>

              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-blue-600 font-semibold focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            {/* PLAN AMOUNT */}
            <div>
              <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
                This Period's Plan Amount
              </label>

              <input
                type="number"
                name="planAmount"
                min="0"
                value={formData.planAmount}
                onChange={handleChange}
                className="no-spinner w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                required
              />

              <p className="text-[10px] text-gray-400 mt-1">
                Current plan's fee only — not the lifetime total
              </p>
            </div>

            {/* AMOUNT PAID */}
            <div>
              <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
                This Period's Amount Paid
              </label>

              <input
                type="number"
                name="amountPayingToday"
                min="0"
                max={formData.planAmount || 0}
                value={formData.amountPayingToday}
                onChange={handleChange}
                className="no-spinner w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-emerald-600 font-bold focus:outline-none focus:border-blue-500"
              />

              <p className="text-[10px] text-gray-400 mt-1">
                Cannot exceed the plan amount
              </p>
            </div>

            {/* BALANCE */}
            <div>
              <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
                Balance Amount
              </label>

              <input
                type="number"
                name="balanceAmount"
                min="0"
                max={formData.planAmount || 0}
                value={formData.balanceAmount}
                onChange={handleBalanceChange}
                className="no-spinner w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-red-500 font-bold focus:outline-none focus:border-blue-500"
                required
              />

              <p className="text-[10px] text-gray-400 mt-1">
                Plan Amount − Amount Paid
              </p>
            </div>

            {/* BALANCE UPDATED DATE */}
            <div>
              <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
                Balance Updated On
              </label>

              <input
                type="date"
                name="balanceUpdateDate"
                value={formData.balanceUpdateDate}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* PAYMENT MODE */}
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
          </div>

          {/* BUTTONS */}
          <div className="flex gap-3 mt-6">

            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold uppercase tracking-wider p-2 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold uppercase tracking-wider p-2 rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              Save Changes
            </button>

          </div>
        </form>
      </div>

      {/* Remove number input spinner arrows */}
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
    </div>
  );
}