import React, { useState } from "react";

export default function EnquiryForm({ onSave }) {
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    whenToJoin: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Pass form data back up to the parent component (AddSelectionContainer
    // dispatches addEnquiry from here). id/enquiryAddDate are no longer
    // generated client-side — the backend stamps its own _id and
    // createdAt now, so sending fake ones here would just be ignored.
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
    <form onSubmit={handleSubmit} className="w-full p-4 text-gray-900">
      <h2 className="text-base font-bold text-gray-900 mb-6 uppercase tracking-wider border-b border-gray-100 pb-2">
        Prospect Enquiry Form
      </h2>
      
      <div className="space-y-4">
        {/* Full Name Field */}
        <div>
          <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
            Full Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition-all placeholder-gray-400"
            placeholder="e.g. John Doe"
            required
          />
        </div>

        {/* Mobile Number Field */}
        <div>
          <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
            Mobile Number
          </label>
          <input
            type="tel"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition-all placeholder-gray-400"
            placeholder="e.g. 9876543210"
            required
          />
        </div>

        {/* Willing to Join Field */}
        <div>
          <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
            When to Join
          </label>
          <input
            type="text"
            name="whenToJoin"
            value={formData.whenToJoin}
            onChange={handleChange}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition-all placeholder-gray-400"
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