import React from "react";
import { X, UserPlus, RefreshCw, User as UserIcon } from "lucide-react";
import { PLAN_LABELS } from "../../redux/slices/membersSlice";

export default function MemberHistoryModal({ member, onClose }) {
  if (!member) return null;

  // Most recent first, capped to the last 3 events.
  const history = [...(member.membershipHistory || [])].reverse().slice(0, 3);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
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
            <div className="space-y-3">
              {history.map((entry) => (
                <div key={entry.id} className="border border-gray-200 rounded-xl p-3.5">
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}