import React from "react";
import { X, UserPlus, RefreshCw, User as UserIcon, Hourglass } from "lucide-react";
import { PLAN_LABELS } from "../../redux/slices/membersSlice";

// ---------------------------------------------------------------
// Turn a day-count gap into a short human label.
// e.g. 62 -> "2 months 2 days", 5 -> "5 days", 1 -> "1 day"
// ---------------------------------------------------------------
function formatGap(days) {
  if (!days || days <= 0) return null;

  if (days < 30) {
    return `${days} day${days === 1 ? "" : "s"}`;
  }

  const months = Math.floor(days / 30);
  const remDays = days % 30;

  const monthLabel = `${months} month${months === 1 ? "" : "s"}`;

  if (remDays === 0) return monthLabel;

  return `${monthLabel} ${remDays} day${remDays === 1 ? "" : "s"}`;
}

// ---------------------------------------------------------------
// Days between two YYYY-MM-DD (or ISO) date strings.
// ---------------------------------------------------------------
function daysBetween(fromDateStr, toDateStr) {
  if (!fromDateStr || !toDateStr) return 0;

  const from = new Date(fromDateStr);
  const to = new Date(toDateStr);

  from.setHours(0, 0, 0, 0);
  to.setHours(0, 0, 0, 0);

  return Math.round((to - from) / (1000 * 60 * 60 * 24));
}

export default function MemberHistoryModal({ member, onClose }) {
  if (!member) return null;

  // Most recent first, capped to the last 6 events (current + last 5).
  const history = [...(member.membershipHistory || [])].reverse().slice(0, 6);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto my-8">
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-bold text-gray-900 uppercase tracking-wider">
              Membership History
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">{member.name} · {member.mobile}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 md:p-6">
          {/* Quick "who added him" summary, always visible even if
              history is somehow empty for an older/legacy record. */}
          <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 mb-5">
            <UserIcon className="h-4 w-4 text-blue-600 shrink-0" />
            <p className="text-xs text-blue-800">
              <span className="font-bold">{member.addedBy || "Unknown"}</span> originally added this member.
            </p>
          </div>

          {history.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-6">No membership history recorded yet.</p>
          ) : (
            <div className="space-y-0">
              {history.map((entry, idx) => {
                // history is newest -> oldest, so the "previous"
                // membership chronologically is the NEXT item in
                // this array (the older one).
                const olderEntry = history[idx + 1];

                const gapDays = olderEntry
                  ? daysBetween(olderEntry.endDate, entry.startDate)
                  : 0;

                // Only flag a real gap — same-day / next-day renewals
                // aren't worth calling out.
                const gapLabel = gapDays > 1 ? formatGap(gapDays) : null;

                return (
                  <React.Fragment key={entry.id}>
                    <div className="border border-gray-200 rounded-xl p-3.5 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          entry.type === "joined" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"
                        }`}>
                          {entry.type === "joined" ? <UserPlus className="h-3 w-3" /> : <RefreshCw className="h-3 w-3" />}
                          {entry.type === "joined" ? "Joined" : "Extended"}
                        </span>
                        <span className="text-xs font-bold text-gray-900">
                          ₹{Number(entry.amount || 0).toLocaleString("en-IN")}
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-gray-800">
                        {PLAN_LABELS[entry.plan] || entry.plan}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {entry.startDate} → {entry.endDate}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                        <UserIcon className="h-3 w-3" />
                        Added by <span className="font-medium text-gray-600">{entry.by}</span> on {entry.date}
                      </p>
                    </div>

                    {/* Gap indicator between this entry and the older
                        one right below it — e.g. member renewed
                        2 months after their previous membership expired. */}
                    {gapLabel && (
                      <div className="flex items-center gap-2 pl-1 mb-3 -mt-1">
                        <div className="w-px h-4 bg-amber-200 ml-3" />
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                          <Hourglass className="h-2.5 w-2.5" />
                          {gapLabel} gap before renewing
                        </span>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}