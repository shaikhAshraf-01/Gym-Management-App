import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { RefreshCw } from "lucide-react";
import { extendMembership } from "../../redux/slices/membersSlice";
import ExtendMembershipModal from "./ExtendMembershipModal";
import WhatsAppRenewMessagePopup from "../adminComponents/WhatsAppRenewMessagePopup";
import { useBackHandler } from "../../hooks/useBackHandler";

// ---------------------------------------------------------------
// Self-contained "Renew" action: renders its own button (desktop
// table cell or mobile card, via `variant`), owns the renew modal,
// dispatches extendMembership itself, and — for Basic-plan gyms —
// shows the WhatsApp renewal-confirmation popup afterwards.
//
// Kept deliberately separate from MembersView so the parent list
// doesn't need to carry any renew-specific state/handlers at all;
// drop <RenewMembershipAction member={member} addedBy={addedBy} .../>
// in wherever a Renew button should appear.
// ---------------------------------------------------------------
export default function RenewMembershipAction({
  member,
  addedBy,
  gymName,
  canUseManualWhatsApp,
  variant = "desktop", // "desktop" | "mobile"
}) {
  const dispatch = useDispatch();

  const [renewingMember, setRenewingMember] = useState(null);
  const [confirmingRenewalMember, setConfirmingRenewalMember] = useState(null);

  useBackHandler(!!renewingMember, () => setRenewingMember(null));
  useBackHandler(!!confirmingRenewalMember, () => setConfirmingRenewalMember(null));

  // Same message shape as the rest of the app's renewal confirmations —
  // uses what was actually submitted in this transaction (amount/plan),
  // not the member's cumulative totals, plus the fresh expiry date
  // that comes back from the backend.
  const buildRenewalMessage = (m) => {
    const gym = gymName || "our gym";
    const payload = m._extensionPayload || {};
    const durationLabel = (payload.plan || m.plan || "").replace("_", "-");
    const balance = Number(payload.balanceAmount ?? m.balanceAmount ?? 0);

    let message = `Hello ${m.name}! 🎉

✅ Your membership at ${gym} has been renewed for ${durationLabel}. We've received your payment of ₹${payload.amountPayingToday || 0}.`;

    if (balance > 0) {
      message += `
💰 Remaining balance: ₹${balance} — please clear this at your earliest convenience.`;
    }

    message += `
📅 Your plan is valid from ${m.joiningDate} to ${m.expiryDate}.

Thank you for continuing with us! 💪🙌`;

    return message;
  };

  const handleSaveRenew = async (id, extensionPayload) => {
    try {
      const updatedMember = await dispatch(
        extendMembership({ id, ...extensionPayload })
      ).unwrap();

      setRenewingMember(null);

      // wa.me renewal confirmation is a Basic-plan-only feature for now —
      // Plus/Pro gyms will get automatic WhatsApp sending once the Cloud
      // API integration is built.
      if (canUseManualWhatsApp) {
        setConfirmingRenewalMember({
          ...updatedMember,
          _extensionPayload: extensionPayload,
        });
      }
    } catch (error) {
      alert(typeof error === "string" ? error : "Failed to renew membership.");
    }
  };

  return (
    <>
      {variant === "mobile" ? (
        <button
          onClick={() => setRenewingMember(member)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-purple-50 active:bg-purple-100 text-purple-700 font-bold text-xs uppercase tracking-wider rounded-lg border border-purple-200 cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Renew</span>
        </button>
      ) : (
        <button
          onClick={() => setRenewingMember(member)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-md border border-purple-200 transition-colors cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Renew</span>
        </button>
      )}

      <ExtendMembershipModal
        member={renewingMember}
        addedBy={addedBy}
        onSave={handleSaveRenew}
        onClose={() => setRenewingMember(null)}
      />

      <WhatsAppRenewMessagePopup
        isOpen={!!confirmingRenewalMember}
        onClose={() => setConfirmingRenewalMember(null)}
        phone={confirmingRenewalMember?.mobile}
        customMessage={
          confirmingRenewalMember ? buildRenewalMessage(confirmingRenewalMember) : ""
        }
      />
    </>
  );
}