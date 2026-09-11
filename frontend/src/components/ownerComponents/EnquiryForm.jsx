import React, { useState } from "react";

export default function EnquiryForm({ onSave }) {
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    whenToJoin: "",
  });

  // Block non-numeric key presses for mobile input
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

  // Block pasting non-numeric text into mobile input
  const handleNumberPaste = (e) => {
    const pastedData = e.clipboardData.getData("text");
    if (!/^\d+$/.test(pastedData)) {
      e.preventDefault();
    }
  };

  const handleChange = (e) => {
    const { name } = e.target;
    let { value } = e.target;

    // Name: letters/spaces only, capped at 32 chars
    if (name === "name") {
      value = value.replace(/[^a-zA-Z\s]/g, "").slice(0, 32);
    }
    // Mobile: digits only
    else if (name === "mobile") {
      value = value.replace(/[^0-9]/g, "");
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (onSave) {
      onSave(formData);
    }

    // Reset Form fields back to defaults
    setFormData({
      name: "",
      mobile: "",
      whenToJoin: "",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex h-full min-h-0 w-full flex-col text-slate-200">
      <h2 className="shrink-0 px-4 pt-4 text-base font-bold uppercase tracking-wider text-white mb-6 border-b border-slate-800 pb-2">
        Prospect Enquiry Form
      </h2>
      
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {/* Full Name Field */}
        <div>
          <label className="block text-xs uppercase font-bold text-slate-500 mb-1">
            Full Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            maxLength={32}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all placeholder-slate-500"
            placeholder="e.g. John Doe"
            required
          />
        </div>

        {/* Mobile Number Field */}
        <div>
          <label className="block text-xs uppercase font-bold text-slate-500 mb-1">
            Mobile Number
          </label>
          <input
            type="tel"
            inputMode="numeric"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            onKeyDown={handleNumberKeyDown}
            onPaste={handleNumberPaste}
            maxLength={10}
            minLength={10}
            pattern="[0-9]{10}"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all placeholder-slate-500"
            placeholder="e.g. 9876543210"
            required
          />
        </div>

        {/* Willing to Join Field */}
        <div>
          <label className="block text-xs uppercase font-bold text-slate-500 mb-1">
            When to Join
          </label>
          <input
            type="text"
            name="whenToJoin"
            value={formData.whenToJoin}
            onChange={handleChange}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all placeholder-slate-500"
            placeholder="e.g. Tomorrow, Next Week, Monday"
            required
          />
        </div>

        {/* Action Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white text-sm font-semibold uppercase tracking-wider p-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer mt-4 shadow-sm"
        >
          Submit Enquiry Entry
        </button>
      </div>
    </form>
  );
}