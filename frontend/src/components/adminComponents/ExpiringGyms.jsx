import React from "react";
import { useSelector } from "react-redux";
import {
  AlertCircle,
  Phone,
  MessageCircle,
} from "lucide-react";

// Gyms whose current subscription ends within this many days show up here.
const EXPIRY_WINDOW_DAYS = 30;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export default function ExpiringGyms() {
  // Matches state.gyms.gyms array from gymSlice
  const gyms = useSelector((state) => state.gyms.gyms) || [];

  const today = new Date();

  const expiringData = gyms
    .map((gym) => {
      const history = gym.subscriptionHistory || [];

      if (history.length === 0) return null;

      // Current plan is the LAST entry in subscriptionHistory
      const current = history[history.length - 1];

      const daysLeft = Math.ceil(
        (new Date(current.endDate) - today) / MS_PER_DAY
      );

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
    // Exclude gyms without history records, and filter window limits
    .filter(
      (gym) =>
        gym !== null &&
        gym.daysLeft >= 0 &&
        gym.daysLeft <= EXPIRY_WINDOW_DAYS
    )
    .sort((a, b) => a.daysLeft - b.daysLeft);

  // ---------------- WHATSAPP MESSAGE ----------------
  const getExpiryMessage = (gym) => {
    let expiryText;

    if (gym.daysLeft === 0) {
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

    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Component Title Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            Expiring Subscriptions
          </h2>

          <p className="text-xs text-slate-500 mt-0.5">
            Subscriptions expiring within {EXPIRY_WINDOW_DAYS} days
          </p>
        </div>

        {expiringData.length > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-semibold">
            <AlertCircle className="h-3.5 w-3.5" />
            Action Required
          </span>
        )}
      </div>

      {expiringData.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-400">
          No subscriptions expiring in the next {EXPIRY_WINDOW_DAYS} days.
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
                        gym.daysLeft <= 3
                          ? "bg-red-50 text-red-700 border-red-200"
                          : gym.daysLeft <= 7
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {gym.daysLeft <= 3 && (
                        <AlertCircle className="h-3.5 w-3.5" />
                      )}

                      <span>
                        {gym.daysLeft === 0
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