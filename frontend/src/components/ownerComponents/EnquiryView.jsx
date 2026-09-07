import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Edit2, Phone, User, Search, X, Calendar, CalendarClock, UserCheck, Trash2, Check, AlertCircle, Download } from "lucide-react";
import { fetchEnquiries, updateEnquiry, deleteEnquiry } from "../../redux/slices/enquiriesSlice";
import { useBackHandler } from "../../hooks/useBackHandler";

export default function EnquiryView() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const enquiries = useSelector((state) => state.enquiries.enquiries);
  const loading = useSelector((state) => state.enquiries.loading);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest"); // newest | oldest

  const [editingId, setEditingId] = useState(null);
  const [editWillingToJoin, setEditWillingToJoin] = useState("");
  // Localized track for current inline delete row/card confirmation
  const [deletingId, setDeletingId] = useState(null);

  // Hardware back button pehle inline edit/delete-confirm ko cancel kare
  useBackHandler(!!editingId, () => setEditingId(null));
  useBackHandler(!!deletingId, () => setDeletingId(null));

  // Enquiries now come from the backend — only fetch if not already
  // loaded, so navigating back to this page doesn't reload every time.
  useEffect(() => {
    if (enquiries.length === 0) {
      dispatch(fetchEnquiries());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const handleConvert = (enquiry) => {
    navigate("/owner/add", {
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

  const searchedEnquiries = enquiries.filter((item) => {
    const query = searchQuery.toLowerCase().trim();
    return item.name.toLowerCase().includes(query) || item.mobile.includes(query);
  });

  const filteredEnquiries = [...searchedEnquiries].sort((a, b) => {
    const dateA = new Date(a.enquiryAddDate).getTime();
    const dateB = new Date(b.enquiryAddDate).getTime();
    return sortOrder === "oldest" ? dateA - dateB : dateB - dateA;
  });

  // ---------------------------------------------------------
  // CSV Export — exports whatever search/sort is currently applied.
  // ---------------------------------------------------------
  const escapeCsvValue = (value) => {
    const str = String(value ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleDownloadCsv = () => {
    const headers = ["Name", "Mobile", "Enquiry Add Date", "Willing to Join"];

    const rows = filteredEnquiries.map((item) => [
      item.name,
      item.mobile,
      item.enquiryAddDate,
      item.whenToJoin,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `enquiries-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full text-slate-400 animate-in fade-in duration-200">

      {/* 🔍 FULL-WIDTH SEARCH BAR */}
      <div className="relative mb-3 w-full">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-500" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search enquiries by name or mobile number..."
          className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-10 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-slate-200 transition-all shadow-sm"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 🧰 SORT + CSV */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="relative">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 rounded-lg text-xs font-medium border border-slate-700 bg-slate-800 text-slate-200 cursor-pointer hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="newest">Newest to Oldest</option>
            <option value="oldest">Oldest to Newest</option>
          </select>
          <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        <button
          type="button"
          onClick={handleDownloadCsv}
          disabled={filteredEnquiries.length === 0}
          title="Download CSV of the current view"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          <span>CSV</span>
        </button>
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl">
          <p className="text-sm font-medium">Loading enquiries...</p>
        </div>
      )}

      {/* FALLBACK NO SEARCH RESULTS */}
      {!loading && filteredEnquiries.length === 0 && (
        <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-700" />
          <p className="text-sm font-medium">No system log enquiries match your search criteria.</p>
        </div>
      )}

      {/* 💻 DESKTOP TABLE VIEW */}
      {filteredEnquiries.length > 0 && (
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Mobile No.</th>
                <th className="py-3 px-4">Enquiry Add Date</th>
                <th className="py-3 px-4">Willing to Join Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {filteredEnquiries.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-white">{item.name}</td>
                  <td className="py-3.5 px-4 text-slate-400">{item.mobile}</td>
                  <td className="py-3.5 px-4 text-slate-400">{item.enquiryAddDate}</td>
                  <td className="py-3.5 px-4">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={editWillingToJoin}
                        onChange={(e) => setEditWillingToJoin(e.target.value)}
                        className="bg-slate-800 border border-cyan-500 rounded p-1 text-xs text-white focus:outline-none w-32 shadow-sm"
                      />
                    ) : (
                      <span className="bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-md text-xs font-medium border border-amber-500/20">
                        {item.whenToJoin}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex justify-end items-center gap-1.5">
                      <a href={`tel:${item.mobile}`} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition-colors cursor-pointer" title="Call Prospect">
                        <Phone className="h-3.5 w-3.5" />
                      </a>
                      <button onClick={() => handleConvert(item)} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold rounded-md border border-cyan-500/20 transition-colors cursor-pointer">
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Convert</span>
                      </button>
                      {editingId === item.id ? (
                        <button onClick={() => handleSaveEdit(item.id)} className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/20 cursor-pointer">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button onClick={() => { setEditingId(item.id); setEditWillingToJoin(item.whenToJoin); }} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-md border border-slate-700 transition-colors cursor-pointer">
                          <Edit2 className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                      )}

                      {deletingId === item.id ? (
                        <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-150">
                          <button onClick={() => handleConfirmDelete(item.id)} className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-md cursor-pointer" title="Confirm Delete">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setDeletingId(null)} className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md cursor-pointer" title="Cancel">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeletingId(item.id)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md border border-red-500/20 cursor-pointer transition-colors" title="Delete Enquiry">
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
            <div key={item.id} className="bg-slate-900/60 backdrop-blur-sm border border-cyan-500/10 rounded-xl p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-base text-white flex items-center gap-1.5">
                    <User className="h-4 w-4 text-slate-500" />
                    {item.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-500" />
                    {item.mobile}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <a href={`tel:${item.mobile}`} className="p-2 bg-slate-800 active:bg-slate-700 text-slate-300 rounded-lg cursor-pointer shrink-0 border border-slate-700" aria-label="Call prospect">
                    <Phone className="h-3.5 w-3.5" />
                  </a>

                  {deletingId === item.id ? (
                    <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 animate-in scale-in duration-100">
                      <button onClick={() => handleConfirmDelete(item.id)} className="px-2 py-1 bg-red-600 active:bg-red-500 text-white text-xs font-bold rounded-md cursor-pointer">
                        Confirm
                      </button>
                      <button onClick={() => setDeletingId(null)} className="px-2 py-1 bg-slate-700 active:bg-slate-600 text-slate-200 text-xs font-bold rounded-md cursor-pointer">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setDeletingId(item.id)} aria-label="Delete enquiry" className="p-2 bg-red-500/10 active:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg cursor-pointer shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-b border-slate-800 py-3 my-3 text-xs">
                <div>
                  <p className="text-slate-500 uppercase font-bold tracking-wider text-[10px] flex items-center gap-1 mb-0.5">
                    <Calendar className="h-3 w-3" /> Add Date
                  </p>
                  <p className="font-semibold text-slate-300">{item.enquiryAddDate}</p>
                </div>
                <div>
                  <p className="text-slate-500 uppercase font-bold tracking-wider text-[10px] flex items-center gap-1 mb-0.5">
                    <CalendarClock className="h-3 w-3" /> Willing To Join
                  </p>
                  {editingId === item.id ? (
                    <input type="text" value={editWillingToJoin} onChange={(e) => setEditWillingToJoin(e.target.value)} className="bg-slate-800 border border-cyan-500 rounded p-1 text-xs text-white focus:outline-none w-full shadow-sm" />
                  ) : (
                    <p className="font-semibold text-slate-300">{item.whenToJoin}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3">
                <button onClick={() => handleConvert(item)} className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-cyan-600 active:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm cursor-pointer">
                  <UserCheck className="h-3.5 w-3.5" />
                  Convert
                </button>
                {editingId !== item.id ? (
                  <button onClick={() => { setEditingId(item.id); setEditWillingToJoin(item.whenToJoin); }} className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 active:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-lg border border-slate-700 cursor-pointer">
                    <Edit2 className="h-3.5 w-3.5" />
                    Change Date
                  </button>
                ) : (
                  <button onClick={() => handleSaveEdit(item.id)} className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 active:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm cursor-pointer">
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