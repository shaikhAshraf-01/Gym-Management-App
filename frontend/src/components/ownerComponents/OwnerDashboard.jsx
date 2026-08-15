import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Phone, CalendarClock, User, Smartphone, RefreshCw, Trash2, Check, X, MessageCircle } from "lucide-react";
import { fetchMembers, deleteMember, extendMembership } from "../../redux/slices/membersSlice";
import { fetchOwnerProfile } from "../../redux/slices/ownerSlice";
import ExtendMembershipModal from "./ExtendMembershipModal";
import WhatsAppMessagePopup from "../adminComponents/WhatsAppMessagePopup";
import WhatsAppRenewMessagePopup from "../adminComponents/WhatsAppRenewMessagePopup";

// How many days out counts as "expiring soon" for this widget.
const EXPIRING_WINDOW_DAYS = 7;

function daysUntil(expiryDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.round((expiry - today) / (1000 * 60 * 60 * 24));
}

export default function OwnerDashboard() {
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

  const [extendingMember, setExtendingMember] = useState(null);
  // Track specific member ID for local inline confirmation state
  const [deletingMemberId, setDeletingMemberId] = useState(null);
  // Member currently being sent an expiry-reminder WhatsApp message
  const [remindingMember, setRemindingMember] = useState(null);
  // Holds { ...updatedMember, _extensionPayload } after a successful
  // extend, so the renewal popup can show the right numbers.
  const [confirmingRenewalMember, setConfirmingRenewalMember] = useState(null);

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

  const expiringMembers = members
    .map((member) => ({ ...member, daysLeft: daysUntil(member.expiryDate) }))
    .filter((member) => member.daysLeft <= EXPIRING_WINDOW_DAYS)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const handleExtend = (member) => {
    setExtendingMember(member);
  };

  const handleSaveExtend = async (id, extensionPayload) => {
    try {
      const updatedMember = await dispatch(extendMembership({ id, ...extensionPayload })).unwrap();
      setExtendingMember(null);
      // wa.me renewal confirmation is a Basic-plan-only feature for now —
      // Plus/Pro gyms will get automatic WhatsApp sending once the Cloud
      // API integration is built, so skip the manual popup for them.
      if (canUseManualWhatsApp) {
        setConfirmingRenewalMember({ ...updatedMember, _extensionPayload: extensionPayload });
      }
    } catch (error) {
      alert(typeof error === "string" ? error : "Failed to extend membership.");
    }
  };

  // Builds the renewal confirmation text — uses what was actually
  // submitted in the extend form (this transaction's amount/plan),
  // not the member's cumulative totals, plus the freshly-computed
  // new expiry date from the backend response.
  const buildRenewalMessage = (member) => {
    const gym = gymName || "our gym";
    const payload = member._extensionPayload || {};
    const durationLabel = (payload.plan || member.plan || "").replace("_", "-");
    const balance = Number(payload.balanceAmount ?? member.balanceAmount ?? 0);

    let message = `Hello ${member.name}! 🎉

✅ Your membership at ${gym} has been renewed for ${durationLabel}. We've received your payment of ₹${payload.amountPayingToday || 0}.`;

    if (balance > 0) {
      message += `
💰 Remaining balance: ₹${balance} — please clear this at your earliest convenience.`;
    }

    message += `
📅 Your new expiry date is ${member.expiryDate}.

Thank you for continuing with us! 💪🙌`;

    return message;
  };

  const handleConfirmDelete = (id) => {
    dispatch(deleteMember(id));
    setDeletingMemberId(null);
  };

  // Builds the expiry-reminder WhatsApp text for a given member.
  const buildExpiryMessage = (member) => {
    const gym = gymName || "our gym";
    let expiryText;

    if (member.daysLeft < 0) {
      expiryText = "has expired";
    } else if (member.daysLeft === 0) {
      expiryText = "expires today";
    } else if (member.daysLeft === 1) {
      expiryText = "expires tomorrow";
    } else {
      expiryText = `expires in ${member.daysLeft} days`;
    }

    return `Hello ${member.name}! 👋

⚠️ Your membership at ${gym} ${expiryText} (${member.expiryDate}).

🔽 Please renew soon to continue enjoying uninterrupted access.

Thank you! 🙏
${gym} Team 💪`;
  };

  return (
    <div className="md:p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen pb-24 md:pb-6 text-gray-600">

      {/* Main Container Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <CalendarClock className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">
            Fees Expiring Soon
          </h3>
        </div>

        {loading && (
          <div className="text-center py-10 text-gray-400 border border-dashed border-gray-200 rounded-xl">
            <p className="text-sm font-medium">Loading members...</p>
          </div>
        )}

        {!loading && expiringMembers.length === 0 && (
          <div className="text-center py-10 text-gray-400 border border-dashed border-gray-200 rounded-xl">
            <p className="text-sm font-medium">No memberships expiring in the next {EXPIRING_WINDOW_DAYS} days.</p>
          </div>
        )}

        {expiringMembers.length > 0 && (
          <>
            {/* Grid Header Layout for Desktop */}
            <div className="hidden md:grid grid-cols-7 gap-4 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border border-gray-200 rounded-t-xl">
              <div>Name</div>
              <div>Mobile</div>
              <div>Expires In</div>
              <div className="text-center">Call</div>
              <div className="text-center">WhatsApp</div>
              <div className="text-center">Extend</div>
              <div className="text-center">Delete</div>
            </div>
            {/* Dynamic List Render Matrix */}
            <div className="divide-y divide-gray-200 border-x border-b border-gray-200 rounded-b-xl overflow-hidden bg-white">
              {expiringMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col md:grid md:grid-cols-7 gap-2 md:gap-4 p-4 px-4 items-start md:items-center hover:bg-gray-50 transition-colors"
                >
                  {/* Column 1: Member Name */}
                  <div className="flex items-center gap-2 font-medium text-gray-900">
                    <User className="h-4 w-4 text-gray-400 md:hidden" />
                    <span>{member.name}</span>
                  </div>

                  {/* Column 2: Mobile Number */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Smartphone className="h-4 w-4 text-gray-400 md:hidden" />
                    <span>{member.mobile}</span>
                  </div>

                  {/* Column 3: Membership Expiration Status Chip */}
                  <div>
                    {member.daysLeft <= 0 ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                        {member.daysLeft === 0 ? "Expired Today" : "Expired"}
                      </span>
                    ) : member.daysLeft <= 2 ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                        {member.daysLeft} Days left
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                        {member.daysLeft} Days left
                      </span>
                    )}
                  </div>

                  {/* Columns 4-7: Action Items */}
                  <div className="w-full grid grid-cols-4 gap-2 md:contents mt-2 md:mt-0">
                    {/* Column 4: Native Device Phone Call Action Trigger */}
                    <a
                      href={`tel:${member.mobile}`}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 md:py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors shadow-sm select-none cursor-pointer"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>Call</span>
                    </a>

                    {/* Column 5: WhatsApp Expiry Reminder — manual wa.me
                        send is a Basic-plan feature for now. Plus/Pro show
                        a disabled placeholder until Cloud API automation
                        is built, keeping the 4-column grid intact. */}
                    {canUseManualWhatsApp ? (
                      <button
                        onClick={() => setRemindingMember(member)}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 md:py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200 text-xs font-medium hover:bg-green-100 transition-colors cursor-pointer"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>WhatsApp</span>
                      </button>
                    ) : (
                      <div
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 md:py-1.5 rounded-lg bg-gray-50 text-gray-400 border border-gray-200 text-xs font-medium cursor-not-allowed"
                        title="Automatic WhatsApp is coming soon for Plus/Pro plans"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>Auto Soon</span>
                      </div>
                    )}

                    {/* Column 6: Extend Plan Action */}
                    <button
                      onClick={() => handleExtend(member)}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 md:py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Extend</span>
                    </button>

                    {/* Column 7: Delete Member Action with Inline Options */}
                    {deletingMemberId === member.id ? (
                      <div className="w-full grid grid-cols-2 gap-1 md:flex md:items-center md:justify-center animate-in scale-in duration-100 col-span-1">
                        <button
                          onClick={() => handleConfirmDelete(member.id)}
                          className="w-full md:w-auto px-2 py-2 md:py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1 hover:bg-red-700"
                        >
                          <Check className="h-3 w-3" />
                          <span className="md:hidden">Confirm</span>
                        </button>
                        <button
                          onClick={() => setDeletingMemberId(null)}
                          className="w-full md:w-auto px-2 py-2 md:py-1.5 bg-gray-200 text-gray-700 text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1 hover:bg-gray-300"
                        >
                          <X className="h-3 w-3" />
                          <span className="md:hidden">Cancel</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingMemberId(member.id)}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 md:py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs font-medium hover:bg-red-100 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 🔄 EXTEND MODAL */}
      <ExtendMembershipModal
        member={extendingMember}
        addedBy={addedBy}
        onSave={handleSaveExtend}
        onClose={() => setExtendingMember(null)}
      />

      {/* 💬 EXPIRY REMINDER WHATSAPP POPUP */}
      <WhatsAppMessagePopup
        isOpen={!!remindingMember}
        onClose={() => setRemindingMember(null)}
        phone={remindingMember?.mobile}
        customMessage={remindingMember ? buildExpiryMessage(remindingMember) : ""}
      />

      {/* 💬 RENEWAL CONFIRMATION WHATSAPP POPUP */}
      <WhatsAppRenewMessagePopup
        isOpen={!!confirmingRenewalMember}
        onClose={() => setConfirmingRenewalMember(null)}
        phone={confirmingRenewalMember?.mobile}
        customMessage={confirmingRenewalMember ? buildRenewalMessage(confirmingRenewalMember) : ""}
      />
    </div>
  );
}