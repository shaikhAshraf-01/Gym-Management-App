import React, { useState } from "react";
import { useDispatch } from "react-redux";
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  RefreshCw,
  Edit2,
  Trash2,
  Check,
  X,
  User as UserIcon,
  UserPlus,
  Hourglass,
  Calendar,
  CalendarX,
} from "lucide-react";
import { PLAN_LABELS, deleteMember } from "../../redux/slices/membersSlice";

// ---------------------------------------------------------------
// Same gap-formatting helpers as the old MemberHistoryModal — history
// now lives here instead of in its own separate modal.
// ---------------------------------------------------------------
function formatGap(days) {
  if (!days || days <= 0) return null;

  if (days < 30) {
    return `${days} day${days === 1 ? "" : "s"}`;
  }

  const totalMonths = Math.floor(days / 30);
  const remDays = days % 30;

  const years = Math.floor(totalMonths / 12);
  const remMonths = totalMonths % 12;

  const parts = [];
  if (years > 0) parts.push(`${years} year${years === 1 ? "" : "s"}`);
  if (remMonths > 0) parts.push(`${remMonths} month${remMonths === 1 ? "" : "s"}`);
  if (remDays > 0) parts.push(`${remDays} day${remDays === 1 ? "" : "s"}`);

  return parts.join(" ");
}

function daysBetween(fromDateStr, toDateStr) {
  if (!fromDateStr || !toDateStr) return 0;
  const from = new Date(fromDateStr);
  const to = new Date(toDateStr);
  from.setHours(0, 0, 0, 0);
  to.setHours(0, 0, 0, 0);
  return Math.round((to - from) / (1000 * 60 * 60 * 24));
}

export default function MemberProfileModal({ member, onClose, onEdit, onExtend }) {
  const dispatch = useDispatch();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (!member) return null;

  const initials = (member.name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const activities = member.activities || [];
  const history = [...(member.membershipHistory || [])].reverse().slice(0, 6);

  // Same native-app-first WhatsApp deep link used across the app.
  const handleOpenWhatsAppChat = (mobile) => {
    const cleanPhone = String(mobile || "").replace(/\D/g, "");
    if (cleanPhone.length !== 10) return;
    const finalPhone = `91${cleanPhone}`;
    const nativeAppUrl = `whatsapp://send?phone=${finalPhone}`;
    const browserFallbackUrl = `https://api.whatsapp.com/send?phone=${finalPhone}`;
    const isMobileDevice =
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.Capacitor;

    if (isMobileDevice) {
      window.location.href = nativeAppUrl;
      setTimeout(() => {
        window.location.href = browserFallbackUrl;
      }, 1500);
    } else {
      window.open(browserFallbackUrl, "MemberWhatsAppChat");
    }
  };

  const handleConfirmDelete = () => {
    dispatch(deleteMember(member.id));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 flex items-center gap-3 px-4 py-4">
        <button onClick={onClose} className="p-1.5 -ml-1.5 text-slate-300 hover:text-white cursor-pointer rounded-lg hover:bg-slate-800">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-base font-bold text-white tracking-tight">Member Detail</h2>
      </div>

      <div className="p-4 max-w-2xl mx-auto pb-10">

        {/* ---------------------------------------------------
            DETAILS CARD
        --------------------------------------------------- */}
        <div className="bg-slate-900/60 backdrop-blur-sm border border-cyan-500/10 rounded-xl p-5 mb-4">
          <div className="flex items-start gap-4 mb-4">
            <div className="h-16 w-16 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-2xl shrink-0">
              {initials || <UserIcon className="h-7 w-7" />}
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3 flex-1">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Name</p>
                <p className="font-bold text-white mt-0.5">{member.name}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Mobile</p>
                <p className="font-semibold text-slate-200 mt-0.5">{member.mobile}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Age</p>
                <p className="font-semibold text-slate-200 mt-0.5">{member.age || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Gender</p>
                <p className="font-semibold text-slate-200 mt-0.5">{member.gender || "—"}</p>
              </div>
            </div>
          </div>

          {/* Quick actions row */}
          <div className="grid grid-cols-4 gap-2 border-t border-slate-800 pt-4">
            <a href={`tel:${member.mobile}`} className="flex flex-col items-center gap-1.5 py-2 rounded-lg hover:bg-slate-800/60 cursor-pointer">
              <div className="p-2.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Phone className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-semibold text-slate-400">Call</span>
            </a>

            <button onClick={() => handleOpenWhatsAppChat(member.mobile)} className="flex flex-col items-center gap-1.5 py-2 rounded-lg hover:bg-slate-800/60 cursor-pointer">
              <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <MessageCircle className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-semibold text-slate-400">WhatsApp</span>
            </button>

            <button onClick={() => onExtend(member)} className="flex flex-col items-center gap-1.5 py-2 rounded-lg hover:bg-slate-800/60 cursor-pointer">
              <div className="p-2.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <RefreshCw className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-semibold text-slate-400">Renew</span>
            </button>

            <button onClick={() => onEdit(member)} className="flex flex-col items-center gap-1.5 py-2 rounded-lg hover:bg-slate-800/60 cursor-pointer">
              <div className="p-2.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Edit2 className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-semibold text-slate-400">Edit</span>
            </button>
          </div>
        </div>

        {/* ---------------------------------------------------
            CURRENT PLAN SUMMARY
        --------------------------------------------------- */}
        <div className="bg-slate-900/60 backdrop-blur-sm border border-cyan-500/10 rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-white uppercase tracking-wider">Current Plan</p>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {PLAN_LABELS[member.plan] || member.plan}
            </span>
          </div>

          {activities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {activities.map((a) => (
                <span key={a} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-medium capitalize">
                  {a}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1"><Calendar className="h-3 w-3" /> Start Date</p>
              <p className="font-semibold text-slate-200 mt-0.5">{member.joiningDate}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1"><CalendarX className="h-3 w-3" /> End Date</p>
              <p className="font-semibold text-slate-200 mt-0.5">{member.expiryDate}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">Total Fees</p>
              <p className="font-semibold text-white mt-0.5">₹{member.planAmount}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">Balance</p>
              <p className={`font-bold mt-0.5 ${Number(member.balanceAmount) > 0 ? "text-red-400" : "text-emerald-400"}`}>
                ₹{member.balanceAmount}
              </p>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------
            MEMBERSHIP HISTORY (embedded — no separate modal now)
        --------------------------------------------------- */}
        <div className="bg-slate-900/60 backdrop-blur-sm border border-cyan-500/10 rounded-xl p-5 mb-4">
          <p className="text-xs font-bold text-white uppercase tracking-wider mb-1">Membership History</p>
          <p className="text-xs text-slate-500 mb-4">
            <span className="font-semibold text-slate-400">{member.addedBy || "Unknown"}</span> originally added this member.
          </p>

          {history.length === 0 ? (
            <p className="text-center text-xs text-slate-500 py-6">No membership history recorded yet.</p>
          ) : (
            <div className="space-y-0">
              {history.map((entry, idx) => {
                const olderEntry = history[idx + 1];
                const gapDays = olderEntry ? daysBetween(olderEntry.endDate, entry.startDate) : 0;
                const gapLabel = gapDays > 1 ? formatGap(gapDays) : null;

                return (
                  <React.Fragment key={entry.id}>
                    <div className="border border-slate-800 rounded-xl p-3.5 mb-3 bg-slate-900/40">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          entry.type === "joined"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : entry.type === "renewed"
                            ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}>
                          {entry.type === "joined" ? <UserPlus className="h-3 w-3" /> : <RefreshCw className="h-3 w-3" />}
                          {entry.type === "joined" ? "Joined" : entry.type === "renewed" ? "Renewed" : "Extended"}
                        </span>
                        <span className="text-xs font-bold text-white">
                          ₹{Number(entry.amount || 0).toLocaleString("en-IN")}
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-slate-200">
                        {PLAN_LABELS[entry.plan] || entry.plan}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {entry.startDate} → {entry.endDate}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                        <UserIcon className="h-3 w-3" />
                        Added by <span className="font-medium text-slate-300">{entry.by}</span> on {entry.date}
                      </p>
                    </div>

                    {gapLabel && (
                      <div className="flex items-center gap-2 pl-1 mb-3 -mt-1">
                        <div className="w-px h-4 bg-amber-500/30 ml-3" />
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">
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

        {/* ---------------------------------------------------
            DELETE (moved here from the old ⋮ dropdown)
        --------------------------------------------------- */}
        <div className="border-t border-slate-800 pt-4">
          {confirmingDelete ? (
            <div className="flex gap-2">
              <button
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white text-sm font-bold uppercase tracking-wider py-2.5 rounded-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4" /> Confirm Delete
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="flex-1 bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-bold uppercase tracking-wider py-2.5 rounded-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <X className="h-4 w-4" /> Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-sm font-bold uppercase tracking-wider py-2.5 rounded-lg cursor-pointer transition-colors"
            >
              <Trash2 className="h-4 w-4" /> Delete Member
            </button>
          )}
        </div>
      </div>
    </div>
  );
}