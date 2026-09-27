import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  AlertCircle,
  Phone,
  MessageCircle,
  CalendarClock,
} from "lucide-react";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// ---------------------------------------------------------
// Days-until-expiry helper (mirrors OwnerDashboard's daysUntil)
// ---------------------------------------------------------
function daysUntil(endDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(endDate);
  expiry.setHours(0, 0, 0, 0);

  return Math.round((expiry - today) / MS_PER_DAY);
}

export default function ExpiringGyms() {
  // Matches state.gyms.gyms array from gymSlice
  const gyms = useSelector((state) => state.gyms.gyms) || [];

  // Default filter = 7 Days (same default window OwnerDashboard uses)
  const [expiryFilter, setExpiryFilter] = useState("7");

  // ---------------------------------------------------------
  // Build daysLeft info for every gym that has a subscription
  // ---------------------------------------------------------
  const gymsWithExpiry = gyms
    .map((gym) => {
      const history = gym.subscriptionHistory || [];

      if (history.length === 0) return null;

      // Current plan is the LAST entry in subscriptionHistory
      const current = history[history.length - 1];
      const daysLeft = daysUntil(current.endDate);

      return {
        id: gym._id,
        name: gym.gymName,
        owner: gym.owner?.name || "—",
        phone: gym.owner?.mobile || "",
        plan: current.plan,
        value: `₹${(current.amount || 0).toLocaleString("en-IN")}`,
        daysLeft,
      };
    })
    .filter((gym) => gym !== null);

  // ---------------------------------------------------------
  // Counts (used for the dropdown option badges)
  // ---------------------------------------------------------
  const count3 = gymsWithExpiry.filter(
    (gym) => gym.daysLeft >= 0 && gym.daysLeft <= 3
  ).length;

  const count7 = gymsWithExpiry.filter(
    (gym) => gym.daysLeft >= 0 && gym.daysLeft <= 7
  ).length;

  const count15 = gymsWithExpiry.filter(
    (gym) => gym.daysLeft >= 0 && gym.daysLeft <= 15
  ).length;

  const countExpired = gymsWithExpiry.filter(
    (gym) => gym.daysLeft < 0
  ).length;

  const countAll = gymsWithExpiry.length;

  const filterOptions = [
    { value: "3", label: "3 Days", count: count3 },
    { value: "7", label: "7 Days", count: count7 },
    { value: "15", label: "15 Days", count: count15 },
    { value: "expired", label: "Expired", count: countExpired },
    { value: "all", label: "All Gyms", count: countAll },
  ];

  // ---------------------------------------------------------
  // Apply selected filter
  // ---------------------------------------------------------
  const expiringData = gymsWithExpiry
    .filter((gym) => {
      switch (expiryFilter) {
        case "3":
          return gym.daysLeft >= 0 && gym.daysLeft <= 3;
        case "7":
          return gym.daysLeft >= 0 && gym.daysLeft <= 7;
        case "15":
          return gym.daysLeft >= 0 && gym.daysLeft <= 15;
        case "expired":
          return gym.daysLeft < 0;
        case "all":
          return true;
        default:
          return false;
      }
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);

  // ---------------- WHATSAPP MESSAGE ----------------
  const getExpiryMessage = (gym) => {
    let expiryText;

    if (gym.daysLeft < 0) {
      expiryText = `Your subscription expired ${Math.abs(
        gym.daysLeft
      )} day(s) ago.`;
    } else if (gym.daysLeft === 0) {
      expiryText = "Your subscription expires today.";
    } else if (gym.daysLeft === 1) {
      expiryText = "Your subscription will expire tomorrow.";
    } else {
      expiryText = `Your subscription will expire in ${gym.daysLeft} days.`;
    }

    return `Hello ${gym.name},

${expiryText}

Plan: ${gym.plan}
Current subscription value: ${gym.value}

Please renew your subscription to continue using FitZone without interruption.

Thank you!
FitZone Team 💪`;
  };

  // ---------------- OPEN WHATSAPP ----------------
  const handleWhatsApp = (gym) => {
    const cleanPhone = String(gym.phone || "").replace(/\D/g, "");

    if (cleanPhone.length !== 10) {
      alert("Invalid WhatsApp mobile number.");
      return;
    }

    const message = getExpiryMessage(gym);

    const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
      message
    )}`;

    // Named target (not "_blank") so clicking WhatsApp for multiple
    // gyms reuses the SAME browser tab instead of stacking up a new
    // tab every time — same pattern used everywhere else in the app.
    window.open(whatsappUrl, "FitZoneWhatsAppTab");
  };

  // ---------------- EMPTY STATE TEXT ----------------
  const emptyStateText = {
    "3": "No subscriptions expiring in the next 3 days.",
    "7": "No subscriptions expiring in the next 7 days.",
    "15": "No subscriptions expiring in the next 15 days.",
    expired: "No expired subscriptions.",
    all: "No gyms found.",
  }[expiryFilter];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* -------------------------------------------------
          Header (title left, filter dropdown fixed right)
      ------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <CalendarClock className="h-5 w-5 text-slate-400 shrink-0" />
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Gym Subscriptions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {expiryFilter === "expired"
                ? "Subscriptions that have already expired"
                : expiryFilter === "all"
                ? "Every gym with a subscription record"
                : `Subscriptions expiring within ${expiryFilter} days`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {expiringData.length > 0 && expiryFilter !== "all" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-semibold shrink-0">
              <AlertCircle className="h-3.5 w-3.5" />
              Action Required
            </span>
          )}

          {/* FILTER DROPDOWN */}
          <div className="relative flex-1 md:flex-none">
            <select
              value={expiryFilter}
              onChange={(e) => setExpiryFilter(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-2 rounded-lg text-sm font-medium border border-slate-200 bg-slate-50 text-slate-700 cursor-pointer hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} ({option.count})
                </option>
              ))}
            </select>

            {/* Dropdown chevron */}
            <svg
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {expiringData.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-400">
          {emptyStateText}
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px] md:min-w-0">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="py-4 px-5">Gym Details</th>
                <th className="py-4 px-5">Owner</th>
                <th className="py-4 px-5 hidden sm:table-cell">
                  Plan / Value
                </th>
                <th className="py-4 px-5 text-right">Time Left</th>
                <th className="py-4 px-5 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-sm">
              {expiringData.map((gym) => (
                <tr
                  key={gym.id}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  {/* 1. Gym Identity Column */}
                  <td className="py-4 px-5">
                    <div className="font-semibold text-slate-800">
                      {gym.name}
                    </div>
                  </td>

                  {/* 2. Owner Contact Column */}
                  <td className="py-4 px-5">
                    <div className="font-medium text-slate-700">
                      {gym.owner}
                    </div>

                    <a
                      href={`tel:${gym.phone}`}
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-0.5"
                    >
                      <Phone className="h-3 w-3" />
                      <span>{gym.phone}</span>
                    </a>
                  </td>

                  {/* 3. Subscription Metadata */}
                  <td className="py-4 px-5 hidden sm:table-cell">
                    <div className="text-slate-700 font-medium">
                      {gym.plan}
                    </div>

                    <div className="text-xs text-slate-500 mt-0.5">
                      {gym.value}
                    </div>
                  </td>

                  {/* 4. Dynamic Time Counter */}
                  <td className="py-4 px-5 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${
                        gym.daysLeft < 0
                          ? "bg-slate-100 text-slate-600 border-slate-200"
                          : gym.daysLeft <= 3
                          ? "bg-red-50 text-red-700 border-red-200"
                          : gym.daysLeft <= 7
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {gym.daysLeft <= 3 && gym.daysLeft >= 0 && (
                        <AlertCircle className="h-3.5 w-3.5" />
                      )}

                      <span>
                        {gym.daysLeft < 0
                          ? `Expired ${Math.abs(gym.daysLeft)}d ago`
                          : gym.daysLeft === 0
                          ? "Expires today"
                          : gym.daysLeft === 1
                          ? "1 day left"
                          : `${gym.daysLeft} days left`}
                      </span>
                    </span>
                  </td>

                  {/* 5. WhatsApp Action */}
                  <td className="py-4 px-5 text-right">
                    <button
                      type="button"
                      onClick={() => handleWhatsApp(gym)}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition-colors shadow-sm"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}