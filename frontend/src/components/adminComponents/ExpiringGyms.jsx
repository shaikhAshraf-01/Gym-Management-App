import React from "react";
import { useSelector } from "react-redux";
import { AlertCircle, Phone, CalendarRange } from "lucide-react";

// Gyms whose current subscription ends within this many days
// will show up here.
const EXPIRY_WINDOW_DAYS = 30;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export default function ExpiringGyms() {
  const gyms = useSelector((state) => state.gyms.gyms || []);

  const today = new Date();

  const expiringData = gyms
    .map((gym) => {
      // Safety check
      if (
        !gym.subscriptionHistory ||
        gym.subscriptionHistory.length === 0
      ) {
        return null;
      }

      // Latest subscription = current subscription
      const current =
        gym.subscriptionHistory[gym.subscriptionHistory.length - 1];

      if (!current?.endDate) {
        return null;
      }

      const daysLeft = Math.ceil(
        (new Date(current.endDate) - today) / MS_PER_DAY
      );

      return {
        // IMPORTANT:
        // Backend sends _id, not id
        id: gym._id,

        // Backend sends gymCode
        gymCode: gym.gymCode,

        // Backend sends gymName
        name: gym.gymName,

        // Owner is populated object
        owner: gym.owner?.name || "Unknown",

        // Owner mobile is inside owner object
        phone: gym.owner?.mobile || "",

        // Backend sends subscriptionPlan
        plan: current.subscriptionPlan,

        value: `₹${Number(current.amount || 0).toLocaleString(
          "en-IN"
        )}`,

        daysLeft,
      };
    })
    // Remove null entries
    .filter(Boolean)

    // Only gyms expiring within next 30 days
    .filter(
      (gym) =>
        gym.daysLeft >= 0 &&
        gym.daysLeft <= EXPIRY_WINDOW_DAYS
    )

    // Soonest expiry first
    .sort((a, b) => a.daysLeft - b.daysLeft);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6 sm:mt-8">

      {/* ================= HEADER ================= */}

      <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarRange className="h-5 w-5 text-amber-500" />

          <h2 className="text-lg font-bold text-slate-800 tracking-tight">
            Expiring Subscriptions
          </h2>
        </div>

        {expiringData.length > 0 && (
          <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full animate-pulse">
            Action Required
          </span>
        )}
      </div>

      {/* ================= EMPTY STATE ================= */}

      {expiringData.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-400">
          No subscriptions expiring in the next{" "}
          {EXPIRY_WINDOW_DAYS} days.
        </div>
      ) : (
        <div className="w-full overflow-x-auto">

          <table className="w-full text-left border-collapse min-w-[600px] md:min-w-0">

            {/* ================= TABLE HEADER ================= */}

            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">

                <th className="py-4 px-5">
                  Gym Details
                </th>

                <th className="py-4 px-5">
                  Owner
                </th>

                <th className="py-4 px-5 hidden sm:table-cell">
                  Plan / Value
                </th>

                <th className="py-4 px-5 text-right">
                  Time Left
                </th>

              </tr>
            </thead>

            {/* ================= TABLE BODY ================= */}

            <tbody className="divide-y divide-slate-100 text-sm">

              {expiringData.map((gym) => (

                // IMPORTANT:
                // _id from MongoDB is unique, so it is the correct key.
                <tr
                  key={gym.id}
                  className="hover:bg-slate-50/60 transition-colors"
                >

                  {/* ================= GYM ================= */}

                  <td className="py-4 px-5">

                    <div className="font-semibold text-slate-800">
                      {gym.name}
                    </div>

                    <div className="text-xs text-slate-400 mt-0.5">
                      {gym.gymCode}
                    </div>

                  </td>

                  {/* ================= OWNER ================= */}

                  <td className="py-4 px-5">

                    <div className="font-medium text-slate-700">
                      {gym.owner}
                    </div>

                    {gym.phone && (
                      <a
                        href={`tel:${gym.phone}`}
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-0.5"
                      >
                        <Phone className="h-3 w-3" />

                        <span>
                          {gym.phone}
                        </span>
                      </a>
                    )}

                  </td>

                  {/* ================= PLAN ================= */}

                  <td className="py-4 px-5 hidden sm:table-cell">

                    <div className="text-slate-700 font-medium">
                      {gym.plan}
                    </div>

                    <div className="text-xs text-slate-500 mt-0.5">
                      {gym.value}
                    </div>

                  </td>

                  {/* ================= TIME LEFT ================= */}

                  <td className="py-4 px-5 text-right">

                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border
                        ${
                          gym.daysLeft <= 3
                            ? "bg-red-50 text-red-700 border-red-200"
                            : gym.daysLeft <= 7
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }
                      `}
                    >

                      {gym.daysLeft <= 3 && (
                        <AlertCircle className="h-3.5 w-3.5" />
                      )}

                      <span>
                        {gym.daysLeft} days left
                      </span>

                    </span>

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