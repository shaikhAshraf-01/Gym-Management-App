import React, { useState } from 'react';
import EnquiryView from './EnquiryView';
import MembersView from './MembersView';

export default function AllMembers() {
  const [activeTab, setActiveTab] = useState('members');

  return (
    // Reduced padding on mobile (p-4 instead of p-6) to save precious horizontal space
    <div className="p-2 md:p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen pb-12 md:pb-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-2 mb-4 md:mb-6 gap-4">
        

        {/* Side-by-Side Toggle Buttons with touch-optimized sizing */}
        <div className="flex bg-gray-200 p-1 rounded-lg w-full md:w-auto">
          <button
            onClick={() => setActiveTab('enquiry')}
            className={`flex-1 md:flex-initial px-4 md:px-6 py-2 text-xs md:text-sm font-medium rounded-md transition-all duration-200 ${
              activeTab === 'enquiry'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Enquiries
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 md:flex-initial px-4 md:px-6 py-2 text-xs md:text-sm font-medium rounded-md transition-all duration-200 ${
              activeTab === 'members'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Members
          </button>
        </div>
      </div>

      {/* Dynamic Component Area - Removed card padding on extra small screens */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 md:p-6">
        {activeTab === 'enquiry' ? <EnquiryView /> : <MembersView />}
      </div>
    </div>
  );
}
