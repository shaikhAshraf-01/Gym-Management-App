import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { CalendarPlus, Phone, User, Search, X, Calendar, CalendarX, MessageCircle, Download } from "lucide-react";
import { fetchMembers, updateMember, extendMembership, PLAN_LABELS } from "../../redux/slices/membersSlice";
import { fetchOwnerProfile } from "../../redux/slices/ownerSlice";
import EditMemberModal from "./EditMemberModal";
import ExtendMembershipModal from "./ExtendMembershipModal";
import RenewMembershipAction from "./RenewMembershipAction";
import MemberProfileModal from "./MemberProfileModal";
import WhatsAppMessagePopup from "../adminComponents/WhatsAppMessagePopup";
import WhatsAppRenewMessagePopup from "../adminComponents/WhatsAppRenewMessagePopup";
import { useBackHandler } from "../../hooks/useBackHandler";

export default function MembersView() {
  const dispatch = useDispatch();
  const members = useSelector((state) => state.members.members);
  const loading = useSelector((state) => state.members.loading);
  const addedBy = useSelector((state) => state.auth.user?.name) || "Unknown";
  // Owner-only (trainers won't have this loaded) — falls back to a
  // generic phrase in the message builder below.
  const gymName = useSelector((state) => state.owner.gym?.gymName);
  const role = useSelector((state) => state.auth.role);
  // WhatsApp reminders (manual wa.me links) are only available on the
  // Basic plan for now — Plus/Pro will get automatic WhatsApp sending
  // once the Cloud API integration is built.
  const subscriptionPlan = useSelector(
    (state) => state.owner.currentSubscription?.subscriptionPlan
  );
  const canUseManualWhatsApp = subscriptionPlan === "Basic";

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | inactive
  const [sortOrder, setSortOrder] = useState("newest"); // newest | oldest
  const [editingMember, setEditingMember] = useState(null); 
  const [extendingMember, setExtendingMember] = useState(null); 
  const [viewingProfileMember, setViewingProfileMember] = useState(null);
  // Member currently being sent a balance-due reminder WhatsApp message
  const [remindingBalanceMember, setRemindingBalanceMember] = useState(null);
  // Member just saved via Edit whose pending balance went from >0 to 0
  // — triggers a "balance received" confirmation WhatsApp popup.
  const [balanceClearedMember, setBalanceClearedMember] = useState(null);
  // Holds { ...updatedMember, _extensionPayload } after a successful
  // extend, so the renewal popup can show the right numbers.
  const [confirmingRenewalMember, setConfirmingRenewalMember] = useState(null);

  // Hardware back button pehle in modals ko close kare, page navigate na kare
  useBackHandler(!!editingMember, () => setEditingMember(null));
  useBackHandler(!!extendingMember, () => setExtendingMember(null));
  useBackHandler(!!viewingProfileMember, () => setViewingProfileMember(null));
  useBackHandler(!!remindingBalanceMember, () => setRemindingBalanceMember(null));
  useBackHandler(!!balanceClearedMember, () => setBalanceClearedMember(null));
  useBackHandler(!!confirmingRenewalMember, () => setConfirmingRenewalMember(null));

  // Members now come from the backend — only fetch if not already
  // loaded, so navigating back to this page doesn't reload every time.
  useEffect(() => {
    if (members.length === 0) {
      dispatch(fetchMembers());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // gymName is needed for the WhatsApp reminder text below — fetch it
  // here too (not just on the Profile page). Owner-only endpoint.
  useEffect(() => {
    if (role === "owner" && !gymName) {
      dispatch(fetchOwnerProfile());
    }
  }, [dispatch, role, gymName]);

  // Builds the balance-due reminder WhatsApp text for a given member.
  const buildBalanceMessage = (member) => {
    const gym = gymName || "our gym";
    return `Hello ${member.name}! 👋

⏰ This is a friendly reminder that you have a pending balance of ₹${member.balanceAmount} at ${gym}.

💰 Please clear it at your earliest convenience.

Thank you! 🙏
${gym} Team 💪`;
  };

  // Builds the "balance received / cleared" confirmation WhatsApp text,
  // sent when an Edit-Member save brings the pending balance to ₹0.
  const buildBalanceReceivedMessage = (member) => {
    const gym = gymName || "our gym";
    return `Hello ${member.name}! 👋

✅ We've received your pending payment — your balance at ${gym} is now fully cleared.

Thank you for your payment! 🙏
${gym} Team 💪`;
  };

  // "Fees khatam" check — membership already expired (expiryDate is in
  // the past) → show Renew, otherwise the plan is still active → Extend.
  const isMemberExpired = (member) => {
    if (!member.expiryDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(member.expiryDate);
    expiry.setHours(0, 0, 0, 0);
    return expiry < today;
  };

  const handleExtend = (member) => setExtendingMember(member);
  const handleViewProfile = (member) => setViewingProfileMember(member);

  // Profile modal's "Edit Profile" button hands off to the existing
  // Edit modal — close one, open the other.
  const handleEditFromProfile = (member) => {
    setViewingProfileMember(null);
    setEditingMember(member);
  };

  // Opens a plain WhatsApp chat thread with the member — no template,
  // no plan gating (unlike the balance-reminder/renewal popups, this
  // is just a deep link, so every plan gets it).
  const handleOpenWhatsAppChat = (mobile) => {
    const cleanPhone = String(mobile || "").replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      alert("Invalid WhatsApp mobile number.");
      return;
    }
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

  const handleSaveEdit = async (id, changes) => {
    const oldBalance = Number(editingMember?.balanceAmount || 0);
    const newBalance = Number(changes.balanceAmount || 0);

    await dispatch(updateMember({ id, changes }));
    setEditingMember(null);

    // Balance just got fully cleared — offer to notify the member.
    if (oldBalance > 0 && newBalance === 0) {
      setBalanceClearedMember({ ...editingMember, ...changes });
    }
  };

const handleSaveExtend = async (id, extensionPayload) => {
  try {
    const updatedMember = await dispatch(extendMembership({ id, ...extensionPayload })).unwrap();
    
    if (canUseManualWhatsApp) {
      // Sahi tarah se updated data aur input payload inject karein
      setConfirmingRenewalMember({ ...updatedMember, _extensionPayload: extensionPayload });
    }
    setExtendingMember(null); // Modal end me close karein
  } catch (error) {
    alert(typeof error === "string" ? error : "Failed to extend membership.");
  }
};

const buildExtensionMessage = (member) => {
  if (!member) return "";
  const gym = gymName || "our gym";
  const payload = member._extensionPayload || {};
  const durationLabel = (payload.plan || member.plan || "").replace("_", "-");
  const balance = Number(payload.balanceAmount ?? member.balanceAmount ?? 0);

  // Dates Fallbacks text safely map karne ke liye
  const startDate = member.joiningDate || payload.joiningDate || "Today";
  const endDate = member.expiryDate || payload.expiryDate || "N/A";

  let message = `Hello ${member.name}! 🎉\n\n✅ Your membership at ${gym} has been updated for ${durationLabel}. We've received your payment of ₹${payload.amountPayingToday || 0}.`;

  if (balance > 0) {
    message += `\n\n💰 Remaining balance: ₹${balance} — please clear this at your earliest convenience.`;
  }

  message += `\n\n📅 Your plan is valid from ${startDate} to ${endDate}.\n\nThank you for continuing with us! 💪🙌`;

  return message;
};

  const searchedMembers = members.filter((member) => {
    const query = searchQuery.toLowerCase().trim();
    return member.name.toLowerCase().includes(query) || member.mobile.includes(query);
  });

  // Active = membership not yet expired. Inactive = expired.
  const activeCount = searchedMembers.filter((m) => !isMemberExpired(m)).length;
  const inactiveCount = searchedMembers.filter((m) => isMemberExpired(m)).length;
  const allCount = searchedMembers.length;

  const statusFilteredMembers = searchedMembers.filter((member) => {
    if (statusFilter === "active") return !isMemberExpired(member);
    if (statusFilter === "inactive") return isMemberExpired(member);
    return true;
  });

  const filteredMembers = [...statusFilteredMembers].sort((a, b) => {
    const dateA = new Date(a.joiningDate).getTime();
    const dateB = new Date(b.joiningDate).getTime();
    return sortOrder === "oldest" ? dateA - dateB : dateB - dateA;
  });

  // ---------------------------------------------------------
  // CSV Export — exports whatever search/status-filter/sort is
  // currently applied.
  // ---------------------------------------------------------
  const escapeCsvValue = (value) => {
    const str = String(value ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleDownloadCsv = () => {
    const headers = [
      "Name",
      "Mobile",
      "Plan",
      "Activities",
      "Joining Date",
      "Expiry Date",
      "Plan Amount",
      "Balance Amount",
      "Status",
    ];

    const rows = filteredMembers.map((member) => [
      member.name,
      member.mobile,
      PLAN_LABELS[member.plan] || member.plan,
      (member.activities || []).join(" + "),
      member.joiningDate,
      member.expiryDate,
      member.planAmount,
      member.balanceAmount,
      isMemberExpired(member) ? "Inactive" : "Active",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `members-${statusFilter}-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full text-slate-400 animate-in fade-in duration-200">
      
      {/* 🔍 SEARCH BAR */}
      <div className="relative mb-3 w-full">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-500" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search members by name or mobile number..."
          className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg pl-10 pr-10 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:bg-slate-800 transition-all shadow-sm"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 🧰 STATUS FILTER + SORT + CSV */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
          {[
            { value: "all", label: "All", count: allCount },
            { value: "active", label: "Active", count: activeCount },
            { value: "inactive", label: "Inactive", count: inactiveCount },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === opt.value
                  ? "bg-slate-700 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {opt.label} ({opt.count})
            </button>
          ))}
        </div>

        <div className="relative ml-auto">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 rounded-lg text-xs font-medium border border-slate-700 bg-slate-800 text-slate-200 cursor-pointer hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="newest">Newest to Oldest</option>
            <option value="oldest">Oldest to Newest</option>
          </select>
          <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        <button
          type="button"
          onClick={handleDownloadCsv}
          disabled={filteredMembers.length === 0}
          title="Download CSV of the current view"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          <span>CSV</span>
        </button>
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl">
          <p className="text-sm font-medium">Loading members...</p>
        </div>
      )}

      {/* FALLBACK NO RESULTS */}
      {!loading && filteredMembers.length === 0 && (
        <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl">
          <p className="text-sm font-medium">No members match your search criteria.</p>
        </div>
      )}

      {/* 💻 DESKTOP TABLE VIEW */}
      {filteredMembers.length > 0 && (
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Mobile No.</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Activities</th>
                <th className="py-3 px-4">Start Date</th>
                <th className="py-3 px-4">End Date</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Bal. Amt</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-white">{member.name}</td>
                  <td className="py-3.5 px-4 text-slate-400">{member.mobile}</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-md text-xs font-medium">
                      {PLAN_LABELS[member.plan] || member.plan}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex max-w-40 flex-wrap gap-1">
                      {(member.activities || []).map((activity) => (
                        <span
                          key={activity}
                          className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium capitalize text-indigo-400"
                        >
                          {activity}
                        </span>
                      ))}
                      {(member.activities || []).length === 0 && (
                        <span className="text-xs text-slate-600">-</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">{member.joiningDate}</td>
                  <td className="py-3.5 px-4 text-slate-400">{member.expiryDate}</td>
                  <td className="py-3.5 px-4 font-medium text-white">₹{member.planAmount}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-bold ${Number(member.balanceAmount) > 0 ? "text-red-400" : "text-emerald-400"}`}>
                        ₹{member.balanceAmount}
                      </span>
                      {Number(member.balanceAmount) > 0 && canUseManualWhatsApp && (
                        <button
                          onClick={() => setRemindingBalanceMember(member)}
                          className="p-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/20 cursor-pointer"
                          title="Send balance reminder via WhatsApp"
                        >
                          <MessageCircle className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <a href={`tel:${member.mobile}`} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition-colors cursor-pointer" title="Call Member">
                        <Phone className="h-3.5 w-3.5" />
                      </a>
                      <button onClick={() => handleOpenWhatsAppChat(member.mobile)} className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/20 transition-colors cursor-pointer" title="Open WhatsApp chat">
                        <MessageCircle className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleViewProfile(member)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold rounded-md border border-cyan-500/20 transition-colors cursor-pointer">
                        <User className="h-3.5 w-3.5" />
                        <span>Profile</span>
                      </button>
                      {isMemberExpired(member) ? (
                        <RenewMembershipAction
                          member={member}
                          addedBy={addedBy}
                          gymName={gymName}
                          canUseManualWhatsApp={canUseManualWhatsApp}
                          variant="desktop"
                          onRenewSuccess={(updateMember,extensionPayload)=>{
                            if(canUseManualWhatsApp){
                              setConfirmingRenewalMember({
                                ...updateMember,
                                _extensionPayload:extensionPayload,
                              })
                            }
                          }}
                        />
                      ) : (
                        <button onClick={() => handleExtend(member)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-md border border-emerald-500/20 transition-colors cursor-pointer">
                          <CalendarPlus className="h-3.5 w-3.5" />
                          <span>Extend</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* 📱 MOBILE CARDS VIEW */}
      {filteredMembers.length > 0 && (
        <div className="block md:hidden space-y-3">
          {filteredMembers.map((member) => (
            <div key={member.id} className="bg-slate-900/60 backdrop-blur-sm border border-cyan-500/10 rounded-xl p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-base text-white flex items-center gap-1.5">
                    <User className="h-4 w-4 text-slate-500" />
                    {member.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-500" />
                    {member.mobile}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                    <a href={`tel:${member.mobile}`} className="p-2 bg-slate-800 active:bg-slate-700 text-slate-300 rounded-lg cursor-pointer shrink-0 border border-slate-700" aria-label="Call member">
                      <Phone className="h-3.5 w-3.5" />
                    </a>

                    <button onClick={() => handleOpenWhatsAppChat(member.mobile)} className="p-2 bg-emerald-500/10 active:bg-emerald-500/20 text-emerald-400 rounded-lg cursor-pointer shrink-0 border border-emerald-500/20" aria-label="Open WhatsApp chat">
                      <MessageCircle className="h-3.5 w-3.5" />
                    </button>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-b border-slate-800 py-3 my-3 text-xs">
                <div>
                  <p className="text-slate-500 uppercase font-bold tracking-wider text-[10px]">Active Plan</p>
                  <p className="font-semibold text-cyan-400 mt-0.5">{PLAN_LABELS[member.plan] || member.plan}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-slate-500 uppercase font-bold tracking-wider text-[10px]">Activities</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(member.activities || []).length > 0 ? (
                      member.activities.map((activity) => (
                        <span
                          key={activity}
                          className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium capitalize text-indigo-400"
                        >
                          {activity}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-600">-</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-slate-500 uppercase font-bold tracking-wider text-[10px] flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Start Date
                  </p>
                  <p className="font-semibold text-slate-300 mt-0.5">{member.joiningDate}</p>
                </div>
                <div>
                  <p className="text-slate-500 uppercase font-bold tracking-wider text-[10px] flex items-center gap-1">
                    <CalendarX className="h-3 w-3" /> End Date
                  </p>
                  <p className="font-semibold text-slate-300 mt-0.5">{member.expiryDate}</p>
                </div>
                <div className="pt-1.5">
                  <p className="text-slate-500 uppercase font-bold tracking-wider text-[10px]">Total Fees</p>
                  <p className="font-semibold text-white mt-0.5">₹{member.planAmount}</p>
                </div>
                <div className="pt-1.5">
                  <p className="text-slate-500 uppercase font-bold tracking-wider text-[10px]">Balance Outstanding</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className={`font-bold ${Number(member.balanceAmount) > 0 ? "text-red-400" : "text-emerald-400"}`}>
                      ₹{member.balanceAmount}
                    </p>
                    {Number(member.balanceAmount) > 0 && canUseManualWhatsApp && (
                      <button
                        onClick={() => setRemindingBalanceMember(member)}
                        className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 active:bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/20 cursor-pointer text-[10px] font-bold"
                      >
                        <MessageCircle className="h-3 w-3" />
                        Remind
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button onClick={() => handleViewProfile(member)} className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-cyan-500/10 active:bg-cyan-500/20 text-cyan-400 font-bold text-xs uppercase tracking-wider rounded-lg border border-cyan-500/20 cursor-pointer">
                  <User className="h-3.5 w-3.5" />
                  <span>Profile</span>
                </button>
                {isMemberExpired(member) ? (
                  <RenewMembershipAction
                    member={member}
                    addedBy={addedBy}
                    gymName={gymName}
                    canUseManualWhatsApp={canUseManualWhatsApp}
                    variant="mobile"
                     onRenewSuccess={(updateMember,extensionPayload)=>{
                            if(canUseManualWhatsApp){
                              setConfirmingRenewalMember({
                                ...updateMember,
                                _extensionPayload:extensionPayload,
                              })
                            }
                          }}
                  />
                ) : (
                  <button onClick={() => handleExtend(member)} className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm cursor-pointer">
                    <CalendarPlus className="h-3.5 w-3.5" />
                    <span>Extend</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✏️ MODALS */}
      <EditMemberModal member={editingMember} onSave={handleSaveEdit} onClose={() => setEditingMember(null)} />
      <ExtendMembershipModal member={extendingMember} addedBy={addedBy} onSave={handleSaveExtend} onClose={() => setExtendingMember(null)} />
      <MemberProfileModal member={viewingProfileMember} onClose={() => setViewingProfileMember(null)} onEdit={handleEditFromProfile} onExtend={(member) => { setViewingProfileMember(null); setExtendingMember(member); }} />

      {/* 💬 BALANCE-DUE REMINDER WHATSAPP POPUP */}
      <WhatsAppMessagePopup
        isOpen={!!remindingBalanceMember}
        onClose={() => setRemindingBalanceMember(null)}
        phone={remindingBalanceMember?.mobile}
        customMessage={remindingBalanceMember ? buildBalanceMessage(remindingBalanceMember) : ""}
      />

      {/* 💬 BALANCE RECEIVED CONFIRMATION WHATSAPP POPUP (Edit Member flow) */}
      <WhatsAppMessagePopup
        isOpen={!!balanceClearedMember}
        onClose={() => setBalanceClearedMember(null)}
        phone={balanceClearedMember?.mobile}
        customMessage={balanceClearedMember ? buildBalanceReceivedMessage(balanceClearedMember) : ""}
      />

      {/* 💬 RENEWAL CONFIRMATION WHATSAPP POPUP (for the Extend button's own flow) */}
      <WhatsAppRenewMessagePopup
        isOpen={!!confirmingRenewalMember}
        onClose={() => setConfirmingRenewalMember(null)}
        phone={confirmingRenewalMember?.mobile}
        customMessage={confirmingRenewalMember ? buildExtensionMessage(confirmingRenewalMember) : ""}
      />

    </div>
  );
}