import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { CreditCard, FileText, ArrowLeft } from "lucide-react";
import MembershipForm from "../../components/ownerComponents/MembershipForm";
import EnquiryForm from "../../components/ownerComponents/EnquiryForm";
import WhatsAppMessagePopup from "../../components/adminComponents/WhatsAppMessagePopup";
// ^ This file physically lives in adminComponents/ (AddGyms.jsx uses it
//   too) — reused here as-is rather than duplicated into ownerComponents/.
import { addMember } from "../../redux/slices/membersSlice";
import { addEnquiry, deleteEnquiry } from "../../redux/slices/enquiriesSlice";
import { fetchOwnerProfile } from "../../redux/slices/ownerSlice";

export default function AddSelectionContainer() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // Whoever is logged in (owner or trainer) gets stamped as `addedBy`
  // on the member record — see membersSlice's addMember.prepare.
  const addedBy = useSelector((state) => state.auth.user?.name) || "Unknown";
  // Owner-only field (trainers don't have this loaded via ownerSlice —
  // GET /owner/profile is owner-only) — falls back to a generic phrase
  // in the message builder below when undefined.
  const gymName = useSelector((state) => state.owner.gym?.gymName);
  const role = useSelector((state) => state.auth.role);

  const [selectedType, setSelectedType] = useState(null); // 'membership' | 'enquiry' | null

  // ✅ Explicitly defined local state container for conversion data
  const [prefillData, setPrefillData] = useState(null);

  // Holds the just-saved member so the WhatsApp confirmation popup can
  // show up right after a successful add, before navigating away.
  const [confirmingMember, setConfirmingMember] = useState(null);

  // gymName is needed for the WhatsApp message text below — fetch it
  // here too (not just on the Profile page) so it's populated no
  // matter which page the owner lands on first. Trainers don't have
  // access to GET /owner/profile, so this is owner-only.
  useEffect(() => {
    if (role === "owner" && !gymName) {
      dispatch(fetchOwnerProfile());
    }
  }, [dispatch, role, gymName]);

  // Capture incoming routing selection state updates from mobile or convert actions
  useEffect(() => {
    if (location.state && location.state.type) {
      setSelectedType(location.state.type);

      // If conversion fields exist in route state, capture them cleanly
      if (location.state.prefill) {
        setPrefillData(location.state.prefill);
      } else {
        setPrefillData(null);
      }
    }
  }, [location.state]);

  const handleBack = () => {
    setSelectedType(null);
    setPrefillData(null);
    // Clear location state history stack to prevent re-triggering on manual reloads
    navigate(location.pathname, { replace: true, state: {} });
  };

  const goToMembersList = () => {
    navigate(location.pathname.startsWith("/trainer") ? "/trainer/all-members" : "/owner/all-members");
  };

  // Builds the WhatsApp confirmation text for a just-added member.
  // Balance line only appears when there's actually money still owed.
  const buildMembershipMessage = (member) => {
    const durationLabel = (member.plan || "").replace("_", "-"); // "3_month" -> "3-month"
    const gym = gymName || "our gym";

    let message = `Welcome to ${gym}, 
Hello ${member.name},  
Your ${durationLabel} membership at ${gym} is now active. We've received your payment of ₹${member.amountPayingToday}.`;

    if (Number(member.balanceAmount) > 0) {
      message += `  
Remaining balance: ₹${member.balanceAmount} — please clear this at your earliest convenience.`;
    }

    message += `  
Thank you for choosing us. We look forward to helping you reach your fitness goals!`;

    return message;
  };

  // 💾 Save a new membership — either a fresh signup, or a converted
  // enquiry (in which case prefillData.enquiryId tells us which
  // enquiry to remove once the member has been created).
  // Navigation is deferred until the WhatsApp popup is dismissed
  // (Cancel/Open WhatsApp) — see handleWhatsAppModalClose.
  const handleSaveMembership = async (formData) => {
    try {
      const savedMember = await dispatch(addMember({ ...formData, addedBy })).unwrap();

      if (prefillData?.enquiryId) {
        dispatch(deleteEnquiry(prefillData.enquiryId));
      }

      setConfirmingMember(savedMember);
    } catch (error) {
      alert(typeof error === "string" ? error : "Failed to add member.");
    }
  };

  const handleWhatsAppModalClose = () => {
    setConfirmingMember(null);
    goToMembersList();
  };

  // 💾 Save a new enquiry/lead — addEnquiry is a real backend call now,
  // so this awaits it and surfaces any failure instead of navigating
  // away optimistically.
  const handleSaveEnquiry = async (formData) => {
    try {
      await dispatch(addEnquiry(formData)).unwrap();
      goToMembersList();
    } catch (error) {
      alert(typeof error === "string" ? error : "Failed to add enquiry.");
    }
  };

  return (
    <div className="p-2 md:p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen pb-24 md:pb-6 text-gray-900">
      <div className="max-w-4xl mx-auto">
        
        {/* 📱 MOBILE SCREEN HEADER AND BACK BUTTON BAR */}
        <div className="block md:hidden mb-4">
          {selectedType ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-blue-600 font-medium text-xs tracking-wide bg-white px-4 py-2 border border-gray-200 rounded-md shadow-sm transition-all active:scale-95 cursor-pointer mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Options</span>
            </button>
          ) : (
            <div className="border-b border-gray-200 pb-2 mb-4">
              <h1 className="text-xl font-bold text-gray-900">
                Management Entry Portal
              </h1>
              <p className="text-gray-500 text-xs mt-1">
                Select entry type below to open administrative data workflows.
              </p>
            </div>
          )}
        </div>

        {/* 💻 DESKTOP SCREEN HEADER */}
        <div className="hidden md:flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-2 mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Management Entry Portal
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Select entry type below to open administrative data workflows.
            </p>
          </div>
        </div>

        {/* 💻/📱 SELECTION TOGGLE BUTTONS (Hidden on mobile if a form option is active) */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 ${selectedType ? "hidden md:grid" : "grid"}`}>
          <button
            type="button"
            onClick={() => { setSelectedType("membership"); setPrefillData(null); }}
            className={`flex items-center gap-4 p-5 rounded-xl border transition-all text-left group cursor-pointer ${
              selectedType === "membership"
                ? "bg-white text-blue-600 border-blue-500 font-semibold shadow-md"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 shadow-sm"
            }`}
          >
            <div className={`p-3 rounded-lg transition-colors ${
              selectedType === "membership" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
            }`}>
              <CreditCard className="h-6 w-6 flex-shrink-0" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Add Membership</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Establish new accounts and packages.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => { setSelectedType("enquiry"); setPrefillData(null); }}
            className={`flex items-center gap-4 p-5 rounded-xl border transition-all text-left group cursor-pointer ${
              selectedType === "enquiry"
                ? "bg-white text-blue-600 border-blue-500 font-semibold shadow-md"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 shadow-sm"
            }`}
          >
            <div className={`p-3 rounded-lg transition-colors ${
              selectedType === "enquiry" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
            }`}>
              <FileText className="h-6 w-6 flex-shrink-0" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Add Enquiry</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Log potential client prospect interests.
              </p>
            </div>
          </button>
        </div>

        {/* DYNAMIC FORM AREA CONTAINER */}
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-2 md:p-6 min-h-[250px] flex items-center justify-center ${selectedType ? "block" : "hidden md:flex"}`}>
          
          {selectedType === "membership" && (
            <MembershipForm prefill={prefillData || null} onSave={handleSaveMembership} />
          )}

          {selectedType === "enquiry" && (
            <EnquiryForm onSave={handleSaveEnquiry} />
          )}
          
          {!selectedType && (
            <div className="text-center p-8 text-gray-400 hidden md:block">
              <p className="text-sm font-medium">No system form entry channel selected.</p>
              <p className="text-xs max-w-xs mx-auto mt-1">
                Choose option blocks above to display creation dashboard fields.
              </p>
            </div>
          )}
        </div>
      </div>

      <WhatsAppMessagePopup
        isOpen={!!confirmingMember}
        onClose={handleWhatsAppModalClose}
        phone={confirmingMember?.mobile}
        customMessage={confirmingMember ? buildMembershipMessage(confirmingMember) : ""}
      />
    </div>
  );
}