import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Phone, CalendarClock, User, Smartphone, RefreshCw, Trash2 } from "lucide-react";
import { deleteMember, extendMembership } from "../../redux/slices/membersSlice";
import ExtendMembershipModal from "./ExtendMembershipModal";

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
  const addedBy = useSelector((state) => state.auth.user?.name) || "Unknown";
  const [extendingMember, setExtendingMember] = useState(null); // member being extended, or null

  // Derive the "expiring soon" list straight from the members store —
  // no separate local copy to fall out of sync.
  const expiringMembers = members
    .map((member) => ({ ...member, daysLeft: daysUntil(member.expiryDate) }))
    .filter((member) => member.daysLeft <= EXPIRING_WINDOW_DAYS)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const handleExtend = (member) => {
    setExtendingMember(member);
  };

  const handleSaveExtend = (id, extensionPayload) => {
    dispatch(extendMembership({ id, ...extensionPayload }));
    setExtendingMember(null);
  };

  const handleDelete = (id, name) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete ${name}?`);
    if (confirmDelete) {
      dispatch(deleteMember(id));
    }
  };

  return (
    /* Clean bg-gray-50 color applied to match AllMembers workspace */
    <div className=" md:p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen pb-24 md:pb-6 text-gray-600">

      {/* Main Container Card - Uses crisp border layout matching AllMembers view container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <CalendarClock className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">
            Fees Expiring Soon
          </h3>
        </div>

        {expiringMembers.length === 0 && (
          <div className="text-center py-10 text-gray-400 border border-dashed border-gray-200 rounded-xl">
            <p className="text-sm font-medium">No memberships expiring in the next {EXPIRING_WINDOW_DAYS} days.</p>
          </div>
        )}

        {expiringMembers.length > 0 && (
          <>
            {/* Grid Header Layout for Desktop */}
            <div className="hidden md:grid grid-cols-6 gap-4 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border border-gray-200 rounded-t-xl">
              <div>Name</div>
              <div>Mobile</div>
              <div>Expires In</div>
              <div className="text-center">Call</div>
              <div className="text-center">Extend</div>
              <div className="text-center">Delete</div>
            </div>

            {/* Dynamic List Render Matrix with standard border styles */}
            <div className="divide-y divide-gray-200 border-x border-b border-gray-200 rounded-b-xl overflow-hidden bg-white">
              {expiringMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col md:grid md:grid-cols-6 gap-2 md:gap-4 p-4 px-4 items-start md:items-center hover:bg-gray-50 transition-colors"
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

                  {/* Column 3: Membership Expiration Status Chip using light design styles */}
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

                  {/* Columns 4-6: Call, Extend, Delete — one row on mobile, three separate columns on desktop */}
                  <div className="w-full grid grid-cols-3 gap-2 md:contents mt-2 md:mt-0">
                    {/* Column 4: Native Device Phone Call Action Trigger */}
                    <a
                      href={`tel:${member.mobile}`}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 md:py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors shadow-sm select-none cursor-pointer"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>Call</span>
                    </a>

                    {/* Column 5: Extend Plan Action — opens ExtendMembershipModal */}
                    <button
                      onClick={() => handleExtend(member)}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 md:py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Extend</span>
                    </button>

                    {/* Column 6: Delete Member Action */}
                    <button
                      onClick={() => handleDelete(member.id, member.name)}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 md:py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs font-medium hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>

                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 🔄 EXTEND MODAL — shown when extendingMember is set */}
      <ExtendMembershipModal
        member={extendingMember}
        addedBy={addedBy}
        onSave={handleSaveExtend}
        onClose={() => setExtendingMember(null)}
      />
    </div>
  );
}