import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Edit2, Phone, User, Search, X, Calendar, CalendarClock, UserCheck, Trash2, Check, AlertCircle } from "lucide-react";
import { fetchEnquiries, updateEnquiry, deleteEnquiry } from "../../redux/slices/enquiriesSlice";

export default function EnquiryView() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const enquiries = useSelector((state) => state.enquiries.enquiries);
  const loading = useSelector((state) => state.enquiries.loading);
  const [searchQuery, setSearchQuery] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editWillingToJoin, setEditWillingToJoin] = useState("");
  // Localized track for current inline delete row/card confirmation
  const [deletingId, setDeletingId] = useState(null);

  // Enquiries now come from the backend — fetch them on mount instead
  // of relying on a hardcoded initialState.
  useEffect(() => {
    dispatch(fetchEnquiries());
  }, [dispatch]);

  const handleConvert = (enquiry) => {
    const addPath= location.pathname.startsWith("/trainer")? "/trainer/add": "/owner/add";
    navigate(addPath, {
      state: {
        type: "membership",
        prefill: { name: enquiry.name, mobile: enquiry.mobile, enquiryId: enquiry.id },
      },
    });
  };

  const handleSaveEdit = (id) => {
    if (!editWillingToJoin.trim()) return;
    dispatch(updateEnquiry({ id, changes: { whenToJoin: editWillingToJoin } }));
    setEditingId(null);
  };

  const handleConfirmDelete = (id) => {
    dispatch(deleteEnquiry(id));
    setDeletingId(null);
  };

  const filteredEnquiries = enquiries.filter((item) => {
    const query = searchQuery.toLowerCase().trim();
    return item.name.toLowerCase().includes(query) || item.mobile.includes(query);
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
          placeholder="Search enquiries by name or mobile number..."
          className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-10 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white text-gray-900 transition-all shadow-sm"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div className="text-center py-12 text-gray-400 border border-dashed border-gray-200 rounded-xl">
          <p className="text-sm font-medium">Loading enquiries...</p>
        </div>
      )}

      {/* FALLBACK NO SEARCH RESULTS */}
      {!loading && filteredEnquiries.length === 0 && (
        <div className="text-center py-12 text-gray-400 border border-dashed border-gray-200 rounded-xl">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm font-medium">No system log enquiries match your search criteria.</p>
        </div>
      )}

      {/* 💻 DESKTOP TABLE VIEW */}
      {filteredEnquiries.length > 0 && (
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Mobile No.</th>
                <th className="py-3 px-4">Enquiry Add Date</th>
                <th className="py-3 px-4">Willing to Join Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredEnquiries.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-gray-900">{item.name}</td>
                  <td className="py-3.5 px-4 text-gray-600">{item.mobile}</td>
                  <td className="py-3.5 px-4 text-gray-600">{item.enquiryAddDate}</td>
                  <td className="py-3.5 px-4">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={editWillingToJoin}
                        onChange={(e) => setEditWillingToJoin(e.target.value)}
                        className="bg-white border border-blue-500 rounded p-1 text-xs text-gray-900 focus:outline-none w-32 shadow-sm"
                      />
                    ) : (
                      <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-md text-xs font-medium border border-amber-100">
                        {item.whenToJoin}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex justify-end items-center gap-1.5">
                      <a href={`tel:${item.mobile}`} className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-md border border-gray-200 transition-colors cursor-pointer" title="Call Prospect">
                        <Phone className="h-3.5 w-3.5" />
                      </a>
                      <button onClick={() => handleConvert(item)} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-md border border-blue-200 transition-colors cursor-pointer">
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Convert</span>
                      </button>
                      {editingId === item.id ? (
                        <button onClick={() => handleSaveEdit(item.id)} className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md border border-emerald-200 cursor-pointer">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button onClick={() => { setEditingId(item.id); setEditWillingToJoin(item.whenToJoin); }} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-md border border-gray-200 transition-colors cursor-pointer">
                          <Edit2 className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                      )}

                      {deletingId === item.id ? (
                        <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-150">
                          <button onClick={() => handleConfirmDelete(item.id)} className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md cursor-pointer" title="Confirm Delete">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setDeletingId(null)} className="p-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md cursor-pointer" title="Cancel">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeletingId(item.id)} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md border border-red-200 cursor-pointer transition-colors" title="Delete Enquiry">
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
      {filteredEnquiries.length > 0 && (
        <div className="block md:hidden space-y-3">
          {filteredEnquiries.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-base text-gray-900 flex items-center gap-1.5">
                    <User className="h-4 w-4 text-gray-400" />
                    {item.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    {item.mobile}
                  </p>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <a href={`tel:${item.mobile}`} className="p-2 bg-gray-100 active:bg-gray-200 text-gray-700 rounded-lg cursor-pointer shrink-0 border border-gray-200" aria-label="Call prospect">
                    <Phone className="h-3.5 w-3.5" />
                  </a>

                  {deletingId === item.id ? (
                    <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200 animate-in scale-in duration-100">
                      <button onClick={() => handleConfirmDelete(item.id)} className="px-2 py-1 bg-red-600 active:bg-red-700 text-white text-xs font-bold rounded-md cursor-pointer">
                        Confirm
                      </button>
                      <button onClick={() => setDeletingId(null)} className="px-2 py-1 bg-gray-200 active:bg-gray-300 text-gray-700 text-xs font-bold rounded-md cursor-pointer">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setDeletingId(item.id)} aria-label="Delete enquiry" className="p-2 bg-red-50 active:bg-red-100 text-red-600 border border-red-100 rounded-lg cursor-pointer shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-b border-gray-100 py-3 my-3 text-xs">
                <div>
                  <p className="text-gray-400 uppercase font-bold tracking-wider text-[10px] flex items-center gap-1 mb-0.5">
                    <Calendar className="h-3 w-3" /> Add Date
                  </p>
                  <p className="font-semibold text-gray-700">{item.enquiryAddDate}</p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase font-bold tracking-wider text-[10px] flex items-center gap-1 mb-0.5">
                    <CalendarClock className="h-3 w-3" /> Willing To Join
                  </p>
                  {editingId === item.id ? (
                    <input type="text" value={editWillingToJoin} onChange={(e) => setEditWillingToJoin(e.target.value)} className="bg-white border border-blue-500 rounded p-1 text-xs text-gray-900 focus:outline-none w-full shadow-sm" />
                  ) : (
                    <p className="font-semibold text-gray-700">{item.whenToJoin}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3">
                <button onClick={() => handleConvert(item)} className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 active:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm cursor-pointer">
                  <UserCheck className="h-3.5 w-3.5" />
                  Convert
                </button>
                {editingId !== item.id ? (
                  <button onClick={() => { setEditingId(item.id); setEditWillingToJoin(item.whenToJoin); }} className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 active:bg-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-lg border border-gray-200 cursor-pointer">
                    <Edit2 className="h-3.5 w-3.5" />
                    Change Date
                  </button>
                ) : (
                  <button onClick={() => handleSaveEdit(item.id)} className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm cursor-pointer">
                    <Check className="h-3.5 w-3.5" />
                    Save Date
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}