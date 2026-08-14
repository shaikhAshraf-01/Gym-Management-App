import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { Wallet, Calendar, TrendingUp } from "lucide-react";
import { PLAN_LABELS } from "../../redux/slices/membersSlice";

// Helper to get normalized Indian Fiscal Year boundaries (1st April to 31st March)
function getFiscalYearRange(isLastYear = false) {
  const today = new Date();
  let currentYear = today.getFullYear();
  // If we are before April, the current fiscal year started last calendar year
  if (today.getMonth() < 3) {
    currentYear -= 1;
  }

  const targetYear = isLastYear ? currentYear - 1 : currentYear;

  const fromDate = `${targetYear}-04-01`;
  const toDate = `${targetYear + 1}-03-31`;
  return { fromDate, toDate };
}

// Helper to get Month boundaries formatted as YYYY-MM-DD
function getMonthRange(isLastMonth = false) {
  const today = new Date();
  let year = today.getFullYear();
  let month = today.getMonth(); // 0-indexed

  if (isLastMonth) {
    if (month === 0) {
      month = 11;
      year -= 1;
    } else {
      month -= 1;
    }
  }

  const startOfPeriod = new Date(year, month, 1);
  const endOfPeriod = new Date(year, month + 1, 0);

  // Format to local YYYY-MM-DD string safely
  const format = (d) => d.toISOString().split("T")[0];
  return { fromDate: format(startOfPeriod), toDate: format(endOfPeriod) };
}

const BAR_COLORS = ["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-violet-500", "bg-rose-500"];

export default function Sales() {
  const members = useSelector((state) => state.members.members);

  // Filter presets: "current-month" | "last-month" | "current-fiscal" | "last-fiscal" | "custom"
  const [datePreset, setDatePreset] = useState("current-month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // Determine active date boundaries based on selected preset
  const activeRange = useMemo(() => {
    if (datePreset === "current-month") return getMonthRange(false);
    if (datePreset === "last-month") return getMonthRange(true);
    if (datePreset === "current-fiscal") return getFiscalYearRange(false);
    if (datePreset === "last-fiscal") return getFiscalYearRange(true);
    return { fromDate: customFrom, toDate: customTo };
  }, [datePreset, customFrom, customTo]);

  // ---------------------------------------------------------------
  // Flatten every member's membershipHistory into individual sale
  // entries. This way every original join AND every renewal counts
  // as its own entry, instead of only the member's latest
  // subscription (which is all the flat `members` list exposes).
  // ---------------------------------------------------------------
  const allSaleEntries = useMemo(() => {
    const entries = [];
    members.forEach((m) => {
      (m.membershipHistory || []).forEach((h) => {
        entries.push({
          memberId: m.id,
          memberName: m.name,
          plan: h.plan,
          amount: Number(h.amount || 0),
          date: h.date, // already YYYY-MM-DD from backend
          type: h.type, // "joined" | "extended"
        });
      });
    });
    return entries;
  }, [members]);

  // Filter sale entries by their event date within the active range
  const incomeEntries = useMemo(() => {
    return allSaleEntries.filter((entry) => {
      if (!entry.date) return false;
      if (activeRange.fromDate && entry.date < activeRange.fromDate) return false;
      if (activeRange.toDate && entry.date > activeRange.toDate) return false;
      return true;
    });
  }, [allSaleEntries, activeRange]);

  // Calculate gross monetary total
  const totalIncome = useMemo(() => {
    return incomeEntries.reduce((sum, entry) => sum + entry.amount, 0);
  }, [incomeEntries]);

  // Compile individual plan allocations (amount + number of entries)
  const planIncome = useMemo(() => {
    const totals = {};
    incomeEntries.forEach((entry) => {
      const key = entry.plan || "unknown";
      if (!totals[key]) {
        totals[key] = { amount: 0, count: 0 };
      }
      totals[key].amount += entry.amount;
      totals[key].count += 1;
    });
    return Object.entries(totals)
      .map(([plan, data]) => ({ plan, amount: data.amount, count: data.count }))
      .sort((a, b) => b.amount - a.amount);
  }, [incomeEntries]);

  const maxPlanAmount = planIncome.length > 0 ? planIncome[0].amount : 0;

  return (
    <div className="p-2 md:p-6 max-w-5xl mx-auto bg-gray-50 min-h-screen pb-24 md:pb-6 text-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 pb-2 mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Sales Overview</h1>
        <p className="text-gray-500 text-xs md:text-sm mt-0.5">
          Track financial performance and plan distribution.
        </p>
      </div>

      {/* Main Income Tracking Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Wallet className="h-5 w-5 text-emerald-600" />
            <h3 className="text-base font-bold text-gray-900">Total Income</h3>
          </div>

          {/* Preset Selector Dropdown */}
          <div className="w-full sm:w-64">
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-gray-900 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="current-month">Current Month</option>
              <option value="last-month">Last Month</option>
              <option value="current-fiscal">Current Fiscal Year</option>
              <option value="last-fiscal">Last Fiscal Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
        </div>

        {/* Custom Range Date Pickers (Condition-rendered when preset is 'custom') */}
        {datePreset === "custom" && (
          <div className="grid grid-cols-2 gap-3 mb-6 p-3 bg-gray-50 border border-gray-100 rounded-xl animate-fadeIn">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> From
              </label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> To
              </label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Dynamic Financial Figure Display */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 text-center mb-3">
          <p className="text-3xl font-black text-emerald-700">₹{totalIncome.toLocaleString("en-IN")}</p>
          <p className="text-xs text-emerald-600 font-medium mt-1 capitalize">
            {datePreset.replace("-", " ")} Performance
          </p>
          {activeRange.fromDate && activeRange.toDate && (
            <p className="text-[10px] text-emerald-500 mt-0.5">
              ({activeRange.fromDate} to {activeRange.toDate})
            </p>
          )}
        </div>

        <p className="text-xs text-gray-500 text-center">
          Generated from {incomeEntries.length} active collection item{incomeEntries.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Row Chart View: Income breakdown by Plan */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
        <div className="flex items-center gap-3 mb-5">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <h3 className="text-base font-bold text-gray-900">Income by Plan</h3>
        </div>

        {planIncome.length === 0 ? (
          <div className="text-center py-10 text-gray-400 border border-dashed border-gray-200 rounded-xl">
            <p className="text-sm font-medium">No sales data recorded for this timeframe.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {planIncome.map((row, idx) => (
              <div key={row.plan}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-gray-700">
                    {PLAN_LABELS[row.plan] || row.plan}
                    <span className="text-gray-400 font-normal ml-1.5">
                      ({row.count} {row.count === 1 ? "entry" : "entries"})
                    </span>
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    ₹{row.amount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${BAR_COLORS[idx % BAR_COLORS.length]} transition-all duration-500`}
                    style={{ width: `${maxPlanAmount > 0 ? (row.amount / maxPlanAmount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}