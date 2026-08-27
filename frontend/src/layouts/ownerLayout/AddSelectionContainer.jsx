import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  CreditCard,
  FileText,
  X,
} from "lucide-react";

import MembershipForm from "../../components/ownerComponents/MembershipForm";
import EnquiryForm from "../../components/ownerComponents/EnquiryForm";
import WhatsAppMessagePopup from "../../components/adminComponents/WhatsAppMessagePopup";

import { addMember } from "../../redux/slices/membersSlice";
import {
  addEnquiry,
  deleteEnquiry,
} from "../../redux/slices/enquiriesSlice";

import { fetchOwnerProfile } from "../../redux/slices/ownerSlice";
import { openDrawer } from "../../redux/slices/uiSlice";
import { useBackHandler } from "../../hooks/useBackHandler";

export default function AddSelectionContainer() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const addedBy =
    useSelector((state) => state.auth.user?.name) || "Unknown";

  const gymName = useSelector(
    (state) => state.owner.gym?.gymName
  );

  const role = useSelector(
    (state) => state.auth.role
  );

  const subscriptionPlan = useSelector(
    (state) =>
      state.owner.currentSubscription?.subscriptionPlan
  );

  const canUseManualWhatsApp =
    subscriptionPlan === "Basic";

  const [selectedType, setSelectedType] =
    useState(null);

  const [prefillData, setPrefillData] =
    useState(null);

  const [confirmingMember, setConfirmingMember] =
    useState(null);

  // ------------------------------------------------------------
  // FETCH OWNER PROFILE
  // ------------------------------------------------------------
  useEffect(() => {
    if (role === "owner" && !gymName) {
      dispatch(fetchOwnerProfile());
    }
  }, [dispatch, role, gymName]);

  // ------------------------------------------------------------
  // ROUTE STATE
  // ------------------------------------------------------------
  useEffect(() => {
    if (location.state && location.state.type) {
      setSelectedType(location.state.type);

      if (location.state.prefill) {
        setPrefillData(location.state.prefill);
      } else {
        setPrefillData(null);
      }
    }
  }, [location.state]);

  // ------------------------------------------------------------
  // CLOSE FORM -> REOPEN THE "CREATE NEW ENTRY" POPUP
  // (instead of dropping the user on the inline options page)
  // ------------------------------------------------------------
  const handleClose = () => {
    setSelectedType(null);
    setPrefillData(null);

    navigate(location.pathname, {
      replace: true,
      state: {},
    });

    // Mobile bottom-sheet ("Create New Entry") wapas khol do,
    // taaki X dabane par popup dikhe, na ki options wala page.
    dispatch(openDrawer());
  };

  // Hardware back button (native app) pe bhi same close behaviour
  // -> form open ho to back se popup khule, page navigate na ho.
  useBackHandler(!!selectedType, handleClose);

  // ------------------------------------------------------------
  // GO TO MEMBERS
  // ------------------------------------------------------------
  const goToMembersList = () => {
    navigate(
      location.pathname.startsWith("/trainer")
        ? "/trainer/all-members"
        : "/owner/all-members"
    );
  };

  // ------------------------------------------------------------
  // WHATSAPP MEMBERSHIP MESSAGE
  // ------------------------------------------------------------
  const buildMembershipMessage = (member) => {
    const durationLabel = (member.plan || "")
      .replace("_", "-");

    const gym = gymName || "our gym";

    let message =
      `🏋️‍♂️ *Welcome to ${gym}!* 🏋️‍♀️\n\n` +
      `Hello *${member.name}*, 👋\n\n` +
      `✨ Your *${durationLabel}* membership at ${gym} is now active!\n` +
      `📅 Plan valid from *${member.joiningDate}* to *${member.expiryDate}*.\n` +
      `💳 We have successfully received your payment of *₹${member.amountPayingToday}*.\n`;

    if (Number(member.balanceAmount) > 0) {
      message +=
        `\n⚠️ *Pending Balance:* ₹${member.balanceAmount}\n` +
        `📌 _Please clear this at your earliest convenience._\n`;
    }

    message +=
      `\nThank you for choosing us! 🙌 We look forward to helping you crush your fitness goals! 💪🔥`;

    return message;
  };

  // ------------------------------------------------------------
  // SAVE MEMBERSHIP
  // ------------------------------------------------------------
  const handleSaveMembership = async (formData) => {
    try {
      const savedMember =
        await dispatch(
          addMember({
            ...formData,
            addedBy,
          })
        ).unwrap();

      if (prefillData?.enquiryId) {
        dispatch(
          deleteEnquiry(prefillData.enquiryId)
        );
      }

      if (canUseManualWhatsApp) {
        setConfirmingMember(savedMember);
      } else {
        goToMembersList();
      }
    } catch (error) {
      alert(
        typeof error === "string"
          ? error
          : "Failed to add member."
      );
    }
  };

  // ------------------------------------------------------------
  // WHATSAPP POPUP CLOSE
  // ------------------------------------------------------------
  const handleWhatsAppModalClose = () => {
    setConfirmingMember(null);
    goToMembersList();
  };

  // ------------------------------------------------------------
  // SAVE ENQUIRY
  // ------------------------------------------------------------
  const handleSaveEnquiry = async (formData) => {
    try {
      await dispatch(
        addEnquiry(formData)
      ).unwrap();

      goToMembersList();
    } catch (error) {
      alert(
        typeof error === "string"
          ? error
          : "Failed to add enquiry."
      );
    }
  };

  return (
    /*
      IMPORTANT:
      h-[100dvh] keeps this screen inside the device viewport.
      overflow-hidden prevents the outer page from scrolling.
    */
    <div className="h-[100dvh] overflow-hidden bg-gray-50 text-gray-900">

      {/* ------------------------------------------------------
          MAIN PAGE
      ------------------------------------------------------ */}
      <div className="h-full max-w-7xl mx-auto px-2 md:px-6">

        <div className="max-w-4xl mx-auto h-full flex flex-col">

          {/* --------------------------------------------------
              MOBILE HEADER
          -------------------------------------------------- */}
          <div className="shrink-0 block md:hidden pt-2">

            {selectedType ? (
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-base font-bold text-gray-900">
                  {selectedType === "membership"
                    ? "Add Membership"
                    : "Add Enquiry"}
                </h1>

                <button
                  onClick={handleClose}
                  aria-label="Close"
                  className="flex items-center justify-center h-9 w-9 rounded-full bg-white border border-gray-200 shadow-sm text-gray-600 active:scale-95 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="border-b border-gray-200 pb-2 mb-4">
                <h1 className="text-xl font-bold text-gray-900">
                  Management Entry Portal
                </h1>

                <p className="text-gray-500 text-xs mt-1">
                  Select entry type below to open
                  administrative data workflows.
                </p>
              </div>
            )}

          </div>

          {/* --------------------------------------------------
              DESKTOP HEADER
          -------------------------------------------------- */}
          <div className="shrink-0 hidden md:flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-2 mb-6 pt-6 gap-4">

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Management Entry Portal
              </h1>

              <p className="text-gray-500 text-sm mt-0.5">
                Select entry type below to open
                administrative data workflows.
              </p>
            </div>

          </div>

          {/* --------------------------------------------------
              SELECTION BUTTONS
          -------------------------------------------------- */}
          <div
            className={`
              shrink-0
              grid grid-cols-1 md:grid-cols-2
              gap-4 mb-4 md:mb-6
              ${
                selectedType
                  ? "hidden md:grid"
                  : "grid"
              }
            `}
          >

            {/* MEMBERSHIP */}
            <button
              type="button"
              onClick={() => {
                setSelectedType("membership");
                setPrefillData(null);
              }}
              className={`
                flex items-center gap-4
                p-5 rounded-xl border
                transition-all text-left
                group cursor-pointer

                ${
                  selectedType === "membership"
                    ? "bg-white text-blue-600 border-blue-500 font-semibold shadow-md"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 shadow-sm"
                }
              `}
            >
              <div
                className={`
                  p-3 rounded-lg
                  transition-colors

                  ${
                    selectedType === "membership"
                      ? "bg-blue-50 text-blue-600"
                      : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                  }
                `}
              >
                <CreditCard className="h-6 w-6 flex-shrink-0" />
              </div>

              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Add Membership
                </h3>

                <p className="text-xs text-gray-500 mt-0.5">
                  Establish new accounts and packages.
                </p>
              </div>
            </button>

            {/* ENQUIRY */}
            <button
              type="button"
              onClick={() => {
                setSelectedType("enquiry");
                setPrefillData(null);
              }}
              className={`
                flex items-center gap-4
                p-5 rounded-xl border
                transition-all text-left
                group cursor-pointer

                ${
                  selectedType === "enquiry"
                    ? "bg-white text-blue-600 border-blue-500 font-semibold shadow-md"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 shadow-sm"
                }
              `}
            >
              <div
                className={`
                  p-3 rounded-lg
                  transition-colors

                  ${
                    selectedType === "enquiry"
                      ? "bg-blue-50 text-blue-600"
                      : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                  }
                `}
              >
                <FileText className="h-6 w-6 flex-shrink-0" />
              </div>

              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Add Enquiry
                </h3>

                <p className="text-xs text-gray-500 mt-0.5">
                  Log potential client prospect interests.
                </p>
              </div>
            </button>

          </div>

          {/* --------------------------------------------------
              FORM CONTAINER

              THIS IS THE IMPORTANT PART.

              Parent:
                overflow-hidden

              Form wrapper:
                flex-1
                min-h-0
                overflow-hidden

              Form itself:
                overflow-y-auto

              Therefore ONLY FORM SCROLLS.
          -------------------------------------------------- */}
          <div
            className={`
              ${
                selectedType
                  ? "flex"
                  : "hidden md:flex"
              }

              flex-1
              min-h-0
              w-full

              bg-white
              rounded-xl
              shadow-sm
              border border-gray-100

              overflow-hidden

              mb-2 md:mb-6
            `}
          >

            {selectedType === "membership" && (
              <div className="w-full h-full min-h-0 overflow-hidden">
                <MembershipForm
                  prefill={prefillData || null}
                  onSave={handleSaveMembership}
                />
              </div>
            )}

            {selectedType === "enquiry" && (
              <div className="w-full h-full min-h-0 overflow-hidden">
                <EnquiryForm
                  onSave={handleSaveEnquiry}
                />
              </div>
            )}

            {!selectedType && (
              <div className="w-full h-full items-center justify-center text-center p-8 text-gray-400 hidden md:flex">
                <div>
                  <p className="text-sm font-medium">
                    No system form entry channel selected.
                  </p>

                  <p className="text-xs max-w-xs mx-auto mt-1">
                    Choose option blocks above to display
                    creation dashboard fields.
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* ------------------------------------------------------
          WHATSAPP POPUP
      ------------------------------------------------------ */}
      <WhatsAppMessagePopup
        isOpen={!!confirmingMember}
        onClose={handleWhatsAppModalClose}
        phone={confirmingMember?.mobile}
        customMessage={
          confirmingMember
            ? buildMembershipMessage(confirmingMember)
            : ""
        }
      />

    </div>
  );
}