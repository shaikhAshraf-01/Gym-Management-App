import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { RefreshCw } from "lucide-react";
import { extendMembership } from "../../redux/slices/membersSlice";
import ExtendMembershipModal from "./ExtendMembershipModal";
import { useBackHandler } from "../../hooks/useBackHandler";

export default function RenewMembershipAction({
  member,
  addedBy,
  gymName,
  canUseManualWhatsApp,
  onRenewSuccess,
  variant = "desktop", // "desktop" | "mobile"
}) {
  const dispatch = useDispatch();

  const [renewingMember, setRenewingMember] = useState(null);

  // Hardware back button -> close renew modal
  useBackHandler(!!renewingMember, () => {
    setRenewingMember(null);
  });

  // ---------------------------------------------------------------
  // Renew Membership
  // ---------------------------------------------------------------
  const handleSaveRenew = async (id, extensionPayload) => {
    try {
      

      const updatedMember = await dispatch(
        extendMembership({
          id,
          ...extensionPayload,
        })
      ).unwrap();


      // IMPORTANT:
      // WhatsApp popup state is handled by MembersView.
      // This component can unmount after Redux updates the member
      // from expired -> active, so popup state must NOT live here.
      if (canUseManualWhatsApp && onRenewSuccess) {

        onRenewSuccess(
          updatedMember,
          extensionPayload
        );
      }

      // Close renewal modal
      setRenewingMember(null);


    } catch (error) {

      alert(
        typeof error === "string"
          ? error
          : "Failed to renew membership."
      );
    }
  };

  // ---------------------------------------------------------------
  // Button
  // ---------------------------------------------------------------
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

      {/* -----------------------------------------------------------
          RENEW / MEMBERSHIP DETAIL MODAL
      ----------------------------------------------------------- */}
      <ExtendMembershipModal
        member={renewingMember}
        addedBy={addedBy}
        onSave={handleSaveRenew}
        onClose={() => setRenewingMember(null)}
      />
    </>
  );
}