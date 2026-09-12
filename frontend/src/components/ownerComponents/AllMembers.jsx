import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import EnquiryView from './EnquiryView';
import MembersView from './MembersView';

export default function AllMembers() {
  const location = useLocation();
  // Arriving here after "Add Enquiry" passes state:{tab:"enquiry"} so
  // we land on the Enquiries tab instead of always defaulting to Members.
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'members');

  const totalMembers = useSelector((state) => state.members.members.length);
  const totalEnquiries = useSelector((state) => state.enquiries.enquiries.length);

  return (
    // Reduced padding on mobile (p-4 instead of p-6) to save precious horizontal space
    <div className="p-2 md:p-6 max-w-7xl mx-auto bg-slate-50 dark:bg-slate-950 min-h-screen pb-12 md:pb-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 dark:border-slate-800 pb-2 mb-4 md:mb-6 gap-4">
        

        {/* Side-by-Side Toggle Buttons with touch-optimized sizing */}
        <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-lg w-full md:w-auto">
          <button
            onClick={() => setActiveTab('enquiry')}
            className={`flex-1 md:flex-initial px-4 md:px-6 py-2 text-xs md:text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 ${
              activeTab === 'enquiry'
                ? 'bg-slate-100 dark:bg-slate-700 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Enquiries
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === 'enquiry'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {totalEnquiries}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 md:flex-initial px-4 md:px-6 py-2 text-xs md:text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 ${
              activeTab === 'members'
                ? 'bg-slate-100 dark:bg-slate-700 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Members
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === 'members'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {totalMembers}
            </span>
          </button>
        </div>
      </div>

      {/* Dynamic Component Area - Removed card padding on extra small screens */}
      <div className="bg-white dark:bg-slate-900/60 backdrop-blur-sm rounded-xl shadow-sm border border-cyan-500/10 p-2 md:p-6">
        {activeTab === 'enquiry' ? <EnquiryView /> : <MembersView />}
      </div>
    </div>
  );
}