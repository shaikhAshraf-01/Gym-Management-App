import React from "react";
import { Building2, CheckCircle2, XCircle, IndianRupee } from "lucide-react"; 
import ExpiringGyms from "./ExpiringGyms";

export default function AdminDashboard() {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
      <header className="mb-6 sm:mb-8 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">Hello Admin</h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">Overview of your app analytics and revenue metrics</p>
      </header>

      {/* 
        Horizontal Scroll Layer:
        📱 Mobile: Single row layout (`flex overflow-x-auto`), customized hide-scrollbar logic, snap points (`snap-x`)
        💻 Desktop: Standard static 4-column layout tree (`md:grid md:grid-cols-4`)
      */}
      <div className="flex overflow-x-auto md:overflow-visible gap-3 sm:gap-5 pb-4 md:pb-0 md:grid md:grid-cols-4 snap-x snap-mandatory scrollbar-none">
        
        {/* Card 1: Total Gyms */}
        <div className="p-4 sm:p-5 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-3 sm:gap-4 min-w-[240px] sm:min-w-0 md:w-full snap-start shrink-0">
          <div className="p-2 sm:p-3 bg-indigo-500 text-white rounded-xl shadow-sm shrink-0">
            <Building2 className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider truncate">Total Gyms</p>
            <p className="mt-0.5 sm:mt-1 text-xl sm:text-3xl font-bold text-slate-900 break-words">148</p>
          </div>
        </div>

        {/* Card 2: Active Gyms */}
        <div className="p-4 sm:p-5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3 sm:gap-4 min-w-[240px] sm:min-w-0 md:w-full snap-start shrink-0">
          <div className="p-2 sm:p-3 bg-emerald-500 text-white rounded-xl shadow-sm shrink-0">
            <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider truncate">Active Gyms</p>
            <p className="mt-0.5 sm:mt-1 text-xl sm:text-3xl font-bold text-slate-900 break-words">132</p>
          </div>
        </div>

        {/* Card 3: Inactive Gyms */}
        <div className="p-4 sm:p-5 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 sm:gap-4 min-w-[240px] sm:min-w-0 md:w-full snap-start shrink-0">
          <div className="p-2 sm:p-3 bg-rose-500 text-white rounded-xl shadow-sm shrink-0">
            <XCircle className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider truncate">Inactive Gyms</p>
            <p className="mt-0.5 sm:mt-1 text-xl sm:text-3xl font-bold text-slate-900 break-words">16</p>
          </div>
        </div>

        {/* Card 4: Total Income */}
      <div className="p-4 sm:p-5 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3 sm:gap-4 min-w-[240px] sm:min-w-0 md:w-full snap-start shrink-0">
          <div className="p-2 sm:p-3 bg-amber-500 text-white rounded-xl shadow-sm shrink-0">
            <IndianRupee className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          {/* Added whitespace-nowrap here to lock text inline safely */}
          <div className="min-w-0 whitespace-nowrap">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider truncate">Total Income</p>
            <p className="mt-0.5 sm:mt-1 text-xl sm:text-3xl font-bold text-slate-900">₹4,52,800</p>
          </div>
          </div>

      </div>
      <ExpiringGyms/>
    </div>
  );
}
