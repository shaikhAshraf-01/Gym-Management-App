import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Phone,
  CalendarClock,
  User,
  Smartphone,
  RefreshCw,
  Trash2,
  Check,
  X,
  MessageCircle,
} from "lucide-react";

import {
  fetchMembers,
  deleteMember,
  extendMembership,
} from "../../redux/slices/membersSlice";

import { fetchOwnerProfile } from "../../redux/slices/ownerSlice";

import ExtendMembershipModal from "./ExtendMembershipModal";
import WhatsAppMessagePopup from "../adminComponents/WhatsAppMessagePopup";
import WhatsAppRenewMessagePopup from "../adminComponents/WhatsAppRenewMessagePopup";

// Active members shown in "Days Left"
const EXPIRING_WINDOW_DAYS = 7;

// ---------------------------------------------------------
// Calculate days until expiry
// ---------------------------------------------------------
function daysUntil(expiryDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  return Math.round(
    (expiry - today) / (1000 * 60 * 60 * 24)
  );
}

function getExpiryStatus(expiryDate) {
  const days = daysUntil(expiryDate);

  // Still active
  if (days > 0) {
    return {
      type: "active",
      daysLeft: days,
    };
  }

  // Expires today
  if (days === 0) {
    return {
      type: "today",
      daysLeft: 0,
    };
  }

  // Number of days since expiry
  const expiredDays = Math.abs(days);

  // More than 3 months
  if (expiredDays > 90) {
    return {
      type: "cold",
      expiredDays,
    };
  }

  // 1–90 days expired
  return {
    type: "warm",
    expiredDays,
  };
}

export default function OwnerDashboard() {
  const dispatch = useDispatch();

  const members = useSelector(
    (state) => state.members.members
  );

  const loading = useSelector(
    (state) => state.members.loading
  );

  const addedBy =
    useSelector((state) => state.auth.user?.name) ||
    "Unknown";

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

  // Manual WhatsApp is available only for Basic
  const canUseManualWhatsApp =
    subscriptionPlan === "Basic";

  // ---------------------------------------------------------
  // Local State
  // ---------------------------------------------------------

  const [extendingMember, setExtendingMember] =
    useState(null);

  const [deletingMemberId, setDeletingMemberId] =
    useState(null);

  const [remindingMember, setRemindingMember] =
    useState(null);

  const [confirmingRenewalMember, setConfirmingRenewalMember] =
    useState(null);

  // Default filter = Days Left
  const [expiryFilter, setExpiryFilter] =
    useState("days");

  // ---------------------------------------------------------
  // Fetch members
  // ---------------------------------------------------------

  useEffect(() => {
    if (members.length === 0) {
      dispatch(fetchMembers());
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // ---------------------------------------------------------
  // Fetch owner profile
  // ---------------------------------------------------------

  useEffect(() => {
    if (role === "owner" && !gymName) {
      dispatch(fetchOwnerProfile());
    }
  }, [dispatch, role, gymName]);

  // ---------------------------------------------------------
  // Prepare expiry information
  // ---------------------------------------------------------

  const expiryMembers = members.map((member) => ({
    ...member,
    expiryInfo: getExpiryStatus(member.expiryDate),
    daysLeft: daysUntil(member.expiryDate),
  }));

  // ---------------------------------------------------------
  // Counts
  // ---------------------------------------------------------

  const daysLeftCount = expiryMembers.filter(
    (member) =>
      member.daysLeft >= 0 &&
      member.daysLeft <= EXPIRING_WINDOW_DAYS
  ).length;

  const warmExpiredCount = expiryMembers.filter(
    (member) =>
      member.expiryInfo.type === "warm"
  ).length;

  const coldExpiredCount = expiryMembers.filter(
    (member) =>
      member.expiryInfo.type === "cold"
  ).length;

  const allCount =
    daysLeftCount +
    warmExpiredCount +
    coldExpiredCount;

  // ---------------------------------------------------------
  // Apply selected filter
  // ---------------------------------------------------------

  const expiringMembers = expiryMembers
    .filter((member) => {
      switch (expiryFilter) {
        // -----------------------------------------
        // Days Left
        // Today + next 7 days
        // -----------------------------------------
        case "days":
          return (
            member.daysLeft >= 0 &&
            member.daysLeft <= EXPIRING_WINDOW_DAYS
          );

        // -----------------------------------------
        // Warm Expired
        // -----------------------------------------
        case "warm":
          return member.expiryInfo.type === "warm";

        // -----------------------------------------
        // Cold Expired
        // -----------------------------------------
        case "cold":
          return member.expiryInfo.type === "cold";

        // -----------------------------------------
        // All
        // -----------------------------------------
        case "all":
          return (
            (member.daysLeft >= 0 &&
              member.daysLeft <=
                EXPIRING_WINDOW_DAYS) ||
            member.expiryInfo.type === "warm" ||
            member.expiryInfo.type === "cold"
          );

        default:
          return false;
      }
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);

  // ---------------------------------------------------------
  // Filter dropdown options (used to build the <select>)
  // ---------------------------------------------------------

  const filterOptions = [
    { value: "all", label: "All", count: allCount },
    { value: "days", label: "Days Left", count: daysLeftCount },
    { value: "warm", label: "Warm Expired", count: warmExpiredCount },
    { value: "cold", label: "Cold Expired", count: coldExpiredCount },
  ];

  // ---------------------------------------------------------
  // Extend Membership
  // ---------------------------------------------------------

  const handleExtend = (member) => {
    setExtendingMember(member);
  };

  const handleSaveExtend = async (
    id,
    extensionPayload
  ) => {
    try {
      const updatedMember = await dispatch(
        extendMembership({
          id,
          ...extensionPayload,
        })
      ).unwrap();

      setExtendingMember(null);

      if (canUseManualWhatsApp) {
        setConfirmingRenewalMember({
          ...updatedMember,
          _extensionPayload: extensionPayload,
        });
      }
    } catch (error) {
      alert(
        typeof error === "string"
          ? error
          : "Failed to extend membership."
      );
    }
  };

  // ---------------------------------------------------------
  // Renewal WhatsApp Message
  // ---------------------------------------------------------

  const buildRenewalMessage = (member) => {
    const gym = gymName || "our gym";

    const payload =
      member._extensionPayload || {};

    const durationLabel = (
      payload.plan ||
      member.plan ||
      ""
    ).replace("_", "-");

    const balance = Number(
      payload.balanceAmount ??
        member.balanceAmount ??
        0
    );

    let message = `Hello ${member.name}! 🎉

✅ Your membership at ${gym} has been renewed for ${durationLabel}. We've received your payment of ₹${payload.amountPayingToday || 0}.`;

    if (balance > 0) {
      message += `
💰 Remaining balance: ₹${balance} — please clear this at your earliest convenience.`;
    }

    message += `
📅 Your plan is valid from ${member.joiningDate} to ${member.expiryDate}.

Thank you for continuing with us! 💪🙌`;

    return message;
  };

  // ---------------------------------------------------------
  // Delete Member
  // ---------------------------------------------------------

  const handleConfirmDelete = (id) => {
    dispatch(deleteMember(id));
    setDeletingMemberId(null);
  };

  // ---------------------------------------------------------
  // Expiry WhatsApp Message
  // ---------------------------------------------------------

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

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------

  return (
    <div className="md:p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen pb-24 md:pb-6 text-gray-600">

      {/* Main Container Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">

        {/* -------------------------------------------------
            Header (title left, filter dropdown fixed right)
        ------------------------------------------------- */}
        <div className="sticky top-0 z-20 bg-white flex items-center justify-between gap-3 mb-6 py-2 -mx-4 px-4 md:-mx-6 md:px-6 border-b border-gray-100">

          <div className="flex items-center gap-3">
            <CalendarClock className="h-6 w-6 text-blue-600" />

            <h3 className="text-lg font-bold text-gray-900 tracking-tight">
              Membership Status
            </h3>
          </div>

          {/* -----------------------------------------------
              FILTER DROPDOWN (replaces the button row)
          ----------------------------------------------- */}
          <div className="relative">
            <select
              value={expiryFilter}
              onChange={(e) =>
                setExpiryFilter(e.target.value)
              }
              className="appearance-none pl-3 pr-8 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-700 cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {filterOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label} ({option.count})
                </option>
              ))}
            </select>

            {/* Dropdown chevron */}
            <svg
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>

        </div>

        {/* -------------------------------------------------
            Loading
        ------------------------------------------------- */}
        {loading && (
          <div className="text-center py-10 text-gray-400 border border-dashed border-gray-200 rounded-xl">
            <p className="text-sm font-medium">
              Loading members...
            </p>
          </div>
        )}

        {/* -------------------------------------------------
            Empty State
        ------------------------------------------------- */}
        {!loading &&
          expiringMembers.length === 0 && (
            <div className="text-center py-10 text-gray-400 border border-dashed border-gray-200 rounded-xl">
              <p className="text-sm font-medium">
                {expiryFilter === "days" &&
                  "No memberships expiring in the next 7 days."}

                {expiryFilter === "warm" &&
                  "No warm expired members."}

                {expiryFilter === "cold" &&
                  "No cold expired members."}

                {expiryFilter === "all" &&
                  "No members found."}
              </p>
            </div>
          )}

        {/* -------------------------------------------------
            MEMBERS TABLE
        ------------------------------------------------- */}
        {!loading &&
          expiringMembers.length > 0 && (
            <>
              {/* Desktop Header */}
              <div className="hidden md:grid grid-cols-7 gap-4 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border border-gray-200 rounded-t-xl">

                <div>Name</div>

                <div>Mobile</div>

                <div>Expires In</div>

                <div className="text-center">
                  Call
                </div>

                <div className="text-center">
                  WhatsApp
                </div>

                <div className="text-center">
                  Extend
                </div>

                <div className="text-center">
                  Delete
                </div>

              </div>

              {/* Dynamic List */}
              <div className="divide-y divide-gray-200 border-x border-b border-gray-200 rounded-b-xl overflow-hidden bg-white">

                {expiringMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-col md:grid md:grid-cols-7 gap-2 md:gap-4 p-4 px-4 items-start md:items-center hover:bg-gray-50 transition-colors"
                  >

                    {/* ---------------------------------------
                        Member Name
                    --------------------------------------- */}
                    <div className="flex items-center gap-2 font-medium text-gray-900">
                      <User className="h-4 w-4 text-gray-400 md:hidden" />

                      <span>
                        {member.name}
                      </span>
                    </div>

                    {/* ---------------------------------------
                        Mobile
                    --------------------------------------- */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Smartphone className="h-4 w-4 text-gray-400 md:hidden" />

                      <span>
                        {member.mobile}
                      </span>
                    </div>

                    {/* ---------------------------------------
                        Expiry Status
                    --------------------------------------- */}
                    <div>

                      {/* Cold */}
                      {member.expiryInfo.type ===
                      "cold" ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          Cold Expired
                        </span>
                      ) : member.expiryInfo.type ===
                        "warm" ? (

                        /* Warm */
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700">
                          Warm Expired
                        </span>

                      ) : member.expiryInfo.type ===
                        "today" ? (

                        /* Today */
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                          Expired Today
                        </span>

                      ) : member.daysLeft <= 2 ? (

                        /* 1-2 Days */
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                          {member.daysLeft}{" "}
                          {member.daysLeft === 1
                            ? "Day"
                            : "Days"}{" "}
                          left
                        </span>

                      ) : (

                        /* 3-7 Days */
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                          {member.daysLeft} Days left
                        </span>
                      )}

                    </div>

                    {/* ---------------------------------------
                        Action Buttons
                    --------------------------------------- */}
                    <div className="w-full grid grid-cols-4 gap-2 md:contents mt-2 md:mt-0">

                      {/* Call */}
                      <a
                        href={`tel:${member.mobile}`}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 md:py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors shadow-sm select-none cursor-pointer"
                      >
                        <Phone className="h-3.5 w-3.5" />

                        <span>
                          Call
                        </span>
                      </a>

                      {/* WhatsApp */}
                      {canUseManualWhatsApp ? (
                        <button
                          onClick={() =>
                            setRemindingMember(
                              member
                            )
                          }
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 md:py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200 text-xs font-medium hover:bg-green-100 transition-colors cursor-pointer"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />

                          <span>
                            WhatsApp
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 md:py-1.5 rounded-lg bg-gray-50 text-gray-400 border border-gray-200 text-xs font-medium cursor-not-allowed"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />

                          <span>
                            WhatsApp
                          </span>
                        </button>
                      )}

                      {/* Extend */}
                      <button
                        onClick={() =>
                          handleExtend(member)
                        }
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 md:py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium hover:bg-emerald-100 transition-colors cursor-pointer"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />

                        <span>
                          Extend
                        </span>
                      </button>

                      {/* Delete */}
                      {deletingMemberId ===
                      member.id ? (
                        <div className="w-full grid grid-cols-2 gap-1 md:flex md:items-center md:justify-center animate-in scale-in duration-100 col-span-1">

                          {/* Confirm */}
                          <button
                            onClick={() =>
                              handleConfirmDelete(
                                member.id
                              )
                            }
                            className="w-full md:w-auto px-2 py-2 md:py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1 hover:bg-red-700"
                          >
                            <Check className="h-3 w-3" />

                            <span className="md:hidden">
                              Confirm
                            </span>
                          </button>

                          {/* Cancel */}
                          <button
                            onClick={() =>
                              setDeletingMemberId(
                                null
                              )
                            }
                            className="w-full md:w-auto px-2 py-2 md:py-1.5 bg-gray-200 text-gray-700 text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1 hover:bg-gray-300"
                          >
                            <X className="h-3 w-3" />

                            <span className="md:hidden">
                              Cancel
                            </span>
                          </button>

                        </div>
                      ) : (
                        <button
                          onClick={() =>
                            setDeletingMemberId(
                              member.id
                            )
                          }
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 md:py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs font-medium hover:bg-red-100 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />

                          <span>
                            Delete
                          </span>
                        </button>
                      )}

                    </div>
                  </div>
                ))}

              </div>
            </>
          )}
      </div>

      {/* -----------------------------------------------------
          EXTEND MODAL
      ----------------------------------------------------- */}
      <ExtendMembershipModal
        member={extendingMember}
        addedBy={addedBy}
        onSave={handleSaveExtend}
        onClose={() =>
          setExtendingMember(null)
        }
      />

      {/* -----------------------------------------------------
          EXPIRY REMINDER WHATSAPP
      ----------------------------------------------------- */}
      <WhatsAppMessagePopup
        isOpen={!!remindingMember}
        onClose={() =>
          setRemindingMember(null)
        }
        phone={remindingMember?.mobile}
        customMessage={
          remindingMember
            ? buildExpiryMessage(
                remindingMember
              )
            : ""
        }
      />

      {/* -----------------------------------------------------
          RENEWAL CONFIRMATION WHATSAPP
      ----------------------------------------------------- */}
      <WhatsAppRenewMessagePopup
        isOpen={
          !!confirmingRenewalMember
        }
        onClose={() =>
          setConfirmingRenewalMember(null)
        }
        phone={
          confirmingRenewalMember?.mobile
        }
        customMessage={
          confirmingRenewalMember
            ? buildRenewalMessage(
                confirmingRenewalMember
              )
            : ""
        }
      />
    </div>
  );
}