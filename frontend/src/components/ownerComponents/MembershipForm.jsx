import React, { useState, useEffect } from "react";

export default function MembershipForm({ onSave, prefill }) {
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

  // 🔄 Prefill listener for automatic conversions from EnquiryView
  useEffect(() => {
    if (prefill) {
      setFormData((prev) => ({
        ...prev,
        name: prefill.name || "",
        mobile: prefill.mobile || ""
      }));
    }
  }, [prefill]);

  // 🧮 Live Calculations during the component render cycle
  const monthsMap = { "1_month": 1, "3_month": 3, "6_month": 6, "1_year": 12 };
  const monthsToAdd = monthsMap[formData.plan] || 1;

  let calculatedExpiry = "";
  if (formData.joiningDate) {
    const date = new Date(formData.joiningDate);
    date.setMonth(date.getMonth() + monthsToAdd);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    calculatedExpiry = `${year}-${month}-${day}`;
  }

  const total = parseFloat(formData.planAmount) || 0;
  const paid = parseFloat(formData.amountPayingToday) || 0;
  const calculatedBalance = Math.max(0, total - paid);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Extra safety check before submission
    if (paid > total) {
      alert("Amount paying today cannot be greater than the Plan Amount!");
      return;
    }

    const finalData = {
      ...formData,
      balanceAmount: calculatedBalance,
      expiryDate: calculatedExpiry
    };

    if (onSave) onSave(finalData);

    // Reset Form Fields back to clean initial values
    setFormData({
      name: "",
      mobile: "",
      age: "",
      plan: "1_month",
      planAmount: "",
      amountPayingToday: "",
      paymentMode: "upi",
      joiningDate: new Date().toISOString().split("T")[0],
      remainingPayingDate: "",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full p-4 text-gray-900 max-h-[70vh] overflow-y-auto pr-2">
      <h2 className="text-base font-bold text-gray-900 mb-6 uppercase tracking-wider border-b border-gray-100 pb-2">
        New Membership Form
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Core Personal Details */}
        <div className="md:col-span-2">
          <label className="block text-xs uppercase font-bold text-gray-500 mb-1">Full Client Name</label>
          <input 
            type="text" name="name" value={formData.name} onChange={handleChange} 
            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500" 
            placeholder="John Doe" required 
          />
        </div>

        <div>
          <label className="block text-xs uppercase font-bold text-gray-500 mb-1">Mobile Number</label>
          <input 
            type="tel" name="mobile" value={formData.mobile} onChange={handleChange} 
            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500" 
            placeholder="e.g. 9876543210" required 
          />
        </div>

        <div>
          <label className="block text-xs uppercase font-bold text-gray-500 mb-1">Age</label>
          <input 
            type="number" name="age" value={formData.age} onChange={handleChange} 
            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500" 
            placeholder="24"  
          />
        </div>

        {/* Plan Configuration */}
        <div>
          <label className="block text-xs uppercase font-bold text-gray-500 mb-1">Select Plan Option</label>
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
          <label className="block text-xs uppercase font-bold text-gray-500 mb-1">Joining Date</label>
          <input 
            type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} 
            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500" 
            required 
          />
        </div>

        {/* Financial Fields */}
        <div>
          <label className="block text-xs uppercase font-bold text-gray-500 mb-1">Plan Amount</label>
          <input 
            type="number" name="planAmount" value={formData.planAmount} onChange={handleChange} 
            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500" 
            placeholder="Enter total package price" required 
          />
        </div>

        <div>
          <label className="block text-xs uppercase font-bold text-gray-500 mb-1">Amount Paying Today</label>
          <input 
            type="number" 
            name="amountPayingToday" 
            value={formData.amountPayingToday} 
            onChange={handleChange} 
            max={formData.planAmount || undefined} // 🌟 Restricts the input value from exceeding the total price
            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-emerald-600 font-bold focus:outline-none focus:border-blue-500" 
            placeholder="Enter collected payment" required 
          />
        </div>

        <div>
          <label className="block text-xs uppercase font-bold text-gray-500 mb-1">Balance Amount</label>
          <input 
            type="number" name="balanceAmount" value={calculatedBalance} readOnly
            className="w-full bg-gray-100 border border-gray-200 rounded-lg p-3 text-sm text-red-500 font-bold cursor-not-allowed outline-none" 
            placeholder="Calculated automatically" 
          />
        </div>

        <div>
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

        {/* Condition Dates */}
        {calculatedBalance > 0 && (
          <div className="transition-all duration-200">
            <label className="block text-xs uppercase font-bold text-gray-500 mb-1">Remaining Paying Date</label>
            <input 
              type="date" name="remainingPayingDate" value={formData.remainingPayingDate} onChange={handleChange} 
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500" 
              required
            />
          </div>
        )}

        <div className={calculatedBalance > 0 ? "" : "md:col-span-2"}>
          <label className="block text-xs uppercase font-bold text-gray-400 mb-1">Automatic Plan Expiry Date</label>
          <input 
            type="date" name="expiryDate" value={calculatedExpiry} readOnly 
            className="w-full bg-gray-100 border border-gray-200 rounded-lg p-3 text-sm text-blue-600 font-semibold cursor-not-allowed outline-none" 
          />
        </div>

        <button 
          type="submit" 
          className="md:col-span-2 w-full bg-blue-600 text-white text-sm font-semibold uppercase tracking-wider p-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer mt-4 shadow-sm"
        >
          Save Client Membership
        </button>
      </div>
    </form>
  );
}
