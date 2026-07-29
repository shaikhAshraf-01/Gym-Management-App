import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Edit2, CalendarPlus, Phone, User, Search, X, Calendar, CalendarX, Trash2, Eye, Check } from "lucide-react";
import { updateMember, deleteMember, extendMembership, PLAN_LABELS } from "../../redux/slices/membersSlice";
import EditMemberModal from "./EditMemberModal";
import ExtendMembershipModal from "./ExtendMembershipModal";
import MemberHistoryModal from "./MemberHistoryModal";

export default function MembersView() {
  const dispatch = useDispatch();
  const members = useSelector((state) => state.members.members);
  const addedBy = useSelector((state) => state.auth.user?.name) || "Unknown";

  const [searchQuery, setSearchQuery] = useState("");
  const [editingMember, setEditingMember] = useState(null); 
  const [extendingMember, setExtendingMember] = useState(null); 
  const [viewingMember, setViewingMember] = useState(null); 
  const [deletingMemberId, setDeletingMemberId] = useState(null);

  const handleEdit = (member) => setEditingMember(member);
  const handleView = (member) => setViewingMember(member);
  const handleExtend = (member) => setExtendingMember(member);

  const handleSaveEdit = (id, changes) => {
    dispatch(updateMember({ id, changes }));
    setEditingMember(null);
  };

  const handleSaveExtend = (id, extensionPayload) => {
    dispatch(extendMembership({ id, ...extensionPayload }));
    setExtendingMember(null);
  };

  const handleConfirmDelete = (id) => {
    dispatch(deleteMember(id));
    setDeletingMemberId(null);
  };

  const filteredMembers = members.filter((member) => {
    const query = searchQuery.toLowerCase().trim();
    return member.name.toLowerCase().includes(query) || member.mobile.includes(query);
  });

  return (
    <div className="w-full text-gray-900 animate-in fade-in duration-200">
      
      {/* 🔍 SEARCH BAR */}
      <div className="relative mb-6 w-full">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search members by name or mobile number..."
          className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-10 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* FALLBACK NO RESULTS */}
      {filteredMembers.length === 0 && (
        <div className="text-center py-12 text-gray-400 border border-dashed border-gray-200 rounded-xl">
          <p className="text-sm font-medium">No members match your search criteria.</p>
        </div>
      )}

      {/* 💻 DESKTOP TABLE VIEW */}
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
                    <div className="flex justify-end items-center gap-2">
                      <a href={`tel:${member.mobile}`} className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-md border border-gray-200 transition-colors cursor-pointer" title="Call Member">
                        <Phone className="h-3.5 w-3.5" />
                      </a>
                      <button onClick={() => handleView(member)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-md border border-blue-200 transition-colors cursor-pointer">
                        <Eye className="h-3.5 w-3.5" />
                        <span>View</span>
                      </button>
                      <button onClick={() => handleExtend(member)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-md border border-emerald-200 transition-colors cursor-pointer">
                        <CalendarPlus className="h-3.5 w-3.5" />
                        <span>Extend</span>
                      </button>
                      <button onClick={() => handleEdit(member)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-md border border-gray-200 transition-colors cursor-pointer">
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                      {deletingMemberId === member.id ? (
                        <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-150">
                          <button onClick={() => handleConfirmDelete(member.id)} className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md cursor-pointer" title="Confirm Delete">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setDeletingMemberId(null)} className="p-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md cursor-pointer" title="Cancel">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeletingMemberId(member.id)} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md border border-red-200 cursor-pointer transition-colors" title="Delete Member">
                          <Trash2 className="h-3.5 w-3.5" />
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
                  
                  <div className="flex items-center gap-1.5">
                    <a href={`tel:${member.mobile}`} className="p-2 bg-gray-100 active:bg-gray-200 text-gray-700 rounded-lg cursor-pointer shrink-0 border border-gray-200" aria-label="Call member">
                      <Phone className="h-3.5 w-3.5" />
                    </a>

                    {deletingMemberId === member.id ? (
                      <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200 animate-in scale-in duration-100">
                        <button onClick={() => handleConfirmDelete(member.id)} className="px-2 py-1 bg-red-600 active:bg-red-700 text-white text-xs font-bold rounded-md cursor-pointer">
                          Confirm
                        </button>
                        <button onClick={() => setDeletingMemberId(null)} className="px-2 py-1 bg-gray-200 active:bg-gray-300 text-gray-700 text-xs font-bold rounded-md cursor-pointer">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setDeletingMemberId(member.id)} aria-label="Delete member" className="p-2 bg-red-50 active:bg-red-100 text-red-600 border border-red-100 rounded-lg cursor-pointer shrink-0">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
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
                <button onClick={() => handleView(member)} className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-blue-50 active:bg-blue-100 text-blue-700 font-bold text-xs uppercase tracking-wider rounded-lg border border-blue-200 cursor-pointer">
                  <Eye className="h-3.5 w-3.5" />
                  <span>View</span>
                </button>
                <button onClick={() => handleExtend(member)} className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm cursor-pointer">
                  <CalendarPlus className="h-3.5 w-3.5" />
                  <span>Extend</span>
                </button>
                <button onClick={() => handleEdit(member)} className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 active:bg-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-lg border border-gray-200 cursor-pointer">
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✏️ MODALS */}
      <EditMemberModal member={editingMember} onSave={handleSaveEdit} onClose={() => setEditingMember(null)} />
      <ExtendMembershipModal member={extendingMember} addedBy={addedBy} onSave={handleSaveExtend} onClose={() => setExtendingMember(null)} />
      <MemberHistoryModal member={viewingMember} onClose={() => setViewingMember(null)} />

    </div>
  );
}
