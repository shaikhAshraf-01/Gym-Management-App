import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Edit2, CalendarPlus, Phone, User, Search, X, Calendar, CalendarX, Trash2, Eye } from "lucide-react";
import { updateMember, deleteMember, extendMembership, PLAN_LABELS } from "../../redux/slices/membersSlice";
import EditMemberModal from "./EditMemberModal";
import ExtendMembershipModal from "./ExtendMembershipModal";
import MemberHistoryModal from "./MemberHistoryModal";

export default function MembersView() {
  const dispatch = useDispatch();
  const members = useSelector((state) => state.members.members);
  // Whoever is logged in (owner or trainer) gets stamped as `addedBy` /
  // `by` on new members and extension history entries.
  const addedBy = useSelector((state) => state.auth.user?.name) || "Unknown";

  const [searchQuery, setSearchQuery] = useState("");
  const [editingMember, setEditingMember] = useState(null); // member being edited, or null
  const [extendingMember, setExtendingMember] = useState(null); // member being extended, or null
  const [viewingMember, setViewingMember] = useState(null); // member whose history is being viewed, or null

  const handleEdit = (member) => {
    setEditingMember(member);
  };

  const handleSaveEdit = (id, changes) => {
    dispatch(updateMember({ id, changes }));
    setEditingMember(null);
  };

  const handleExtend = (member) => {
    setExtendingMember(member);
  };

  const handleSaveExtend = (id, extensionPayload) => {
    dispatch(extendMembership({ id, ...extensionPayload }));
    setExtendingMember(null);
  };

  const handleView = (member) => {
    setViewingMember(member);
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to permanently delete ${name}?`)) {
      dispatch(deleteMember(id));
    }
  };

  const filteredMembers = members.filter((member) => {
    const query = searchQuery.toLowerCase().trim();
    return (
      member.name.toLowerCase().includes(query) ||
      member.mobile.includes(query)
    );
  });

  return (
    <div className="w-full text-gray-900 animate-in fade-in duration-200">
      
      {/* 🔍 FULL-WIDTH SEARCH BAR */}
      <div className="relative mb-6 w-full">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search members by name or mobile number..."
          className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-10 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white text-gray-900 transition-all shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* FALLBACK NO SEARCH RESULTS VIEW */}
      {filteredMembers.length === 0 && (
        <div className="text-center py-12 text-gray-400 border border-dashed border-gray-200 rounded-xl">
          <p className="text-sm font-medium">No members match your search criteria.</p>
          <p className="text-xs mt-1">Try checking the spelling or typing a different phone string.</p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 💻 DESKTOP TABLE VIEW */}
      {/* ========================================================================= */}
      {filteredMembers.length > 0 && (
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Mobile No.</th>
                <th className="py-3 px-4">Age</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Start Date</th>
                <th className="py-3 px-4">End Date</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Bal. Amt</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-gray-900">{member.name}</td>
                  <td className="py-3.5 px-4 text-gray-600">{member.mobile}</td>
                  <td className="py-3.5 px-4 text-gray-600">{member.age}</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-medium">
                      {PLAN_LABELS[member.plan] || member.plan}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-gray-600">{member.joiningDate}</td>
                  <td className="py-3.5 px-4 text-gray-600">{member.expiryDate}</td>
                  <td className="py-3.5 px-4 font-medium text-gray-900">₹{member.planAmount}</td>
                  <td className="py-3.5 px-4">
                    <span className={`font-bold ${Number(member.balanceAmount) > 0 ? "text-red-500" : "text-emerald-600"}`}>
                      ₹{member.balanceAmount}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleView(member)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-md border border-blue-200 transition-colors cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => handleExtend(member)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-md border border-emerald-200 transition-colors cursor-pointer"
                      >
                        <CalendarPlus className="h-3.5 w-3.5" />
                        <span>Extend</span>
                      </button>
                      <button
                        onClick={() => handleEdit(member)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-md border border-gray-200 transition-colors cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(member.id, member.name)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md border border-red-200 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📱 MOBILE CARDS VIEW */}
      {/* ========================================================================= */}
      {filteredMembers.length > 0 && (
        <div className="block md:hidden space-y-3">
          {filteredMembers.map((member) => (
            <div key={member.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-base text-gray-900 flex items-center gap-1.5">
                    <User className="h-4 w-4 text-gray-400" />
                    {member.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    {member.mobile}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-md">
                    Age: {member.age}
                  </span>
                  <button
                    onClick={() => handleDelete(member.id, member.name)}
                    aria-label="Delete member"
                    className="p-2 bg-red-50 active:bg-red-100 text-red-600 border border-red-100 rounded-lg cursor-pointer shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-b border-gray-100 py-3 my-3 text-xs">
                <div>
                  <p className="text-gray-400 uppercase font-bold tracking-wider text-[10px]">Active Plan</p>
                  <p className="font-semibold text-blue-600 mt-0.5">{PLAN_LABELS[member.plan] || member.plan}</p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase font-bold tracking-wider text-[10px]">Total Fees</p>
                  <p className="font-semibold text-gray-900 mt-0.5">₹{member.planAmount}</p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase font-bold tracking-wider text-[10px] flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Start Date
                  </p>
                  <p className="font-semibold text-gray-700 mt-0.5">{member.joiningDate}</p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase font-bold tracking-wider text-[10px] flex items-center gap-1">
                    <CalendarX className="h-3 w-3" /> End Date
                  </p>
                  <p className="font-semibold text-gray-700 mt-0.5">{member.expiryDate}</p>
                </div>
                <div className="col-span-2 pt-1.5">
                  <p className="text-gray-400 uppercase font-bold tracking-wider text-[10px]">Balance Outstanding</p>
                  <p className={`font-bold mt-0.5 ${Number(member.balanceAmount) > 0 ? "text-red-500" : "text-emerald-600"}`}>
                    ₹{member.balanceAmount}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={() => handleView(member)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-blue-50 active:bg-blue-100 text-blue-700 font-bold text-xs uppercase tracking-wider rounded-lg border border-blue-200 cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>View</span>
                </button>
                <button
                  onClick={() => handleExtend(member)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm cursor-pointer"
                >
                  <CalendarPlus className="h-3.5 w-3.5" />
                  <span>Extend</span>
                </button>
                <button
                  onClick={() => handleEdit(member)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 active:bg-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-lg border border-gray-200 cursor-pointer"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✏️ EDIT MODAL — shown when editingMember is set */}
      <EditMemberModal
        member={editingMember}
        onSave={handleSaveEdit}
        onClose={() => setEditingMember(null)}
      />

      {/* 🔄 EXTEND MODAL — shown when extendingMember is set */}
      <ExtendMembershipModal
        member={extendingMember}
        addedBy={addedBy}
        onSave={handleSaveExtend}
        onClose={() => setExtendingMember(null)}
      />

      {/* 👁 HISTORY MODAL — shown when viewingMember is set */}
      <MemberHistoryModal
        member={viewingMember}
        onClose={() => setViewingMember(null)}
      />

    </div>
  );
}