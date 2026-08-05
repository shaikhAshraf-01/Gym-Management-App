import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Phone,
  Mail,
  Calendar,
  Users,
  Edit3,
  ShieldAlert,
  X,
  Trash2,
  Plus,
  RefreshCw,
  History,
  IndianRupee,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { fetchGyms, updateGym, deleteGym } from "../../redux/slices/gymSlice";
// ^ Adjust this import path to wherever gymsSlice.js actually lives
//   in your folder structure (e.g. "../../../features/superAdmin/gymsSlice").

export default function AllGyms() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchGyms());
  }, [dispatch]);
  const navigate = useNavigate();

  // ------------------------------------------------------------------
  // 1. TOP LEVEL STATE
  // ------------------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'inactive'
  const [selectedGym, setSelectedGym] = useState(null); // gym currently open in the EDIT drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Gym currently open in the TIMELINE modal. Separate from selectedGym
  // so "Edit" and "View Timeline" don't fight over the same state.
  const [timelineGym, setTimelineGym] = useState(null);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

  // Confirmation state for destructive actions (gym delete / trainer delete).
  // Kept generic so ONE confirm modal can handle both cases.
  const [confirmDelete, setConfirmDelete] = useState(null);

  const {
    gyms: gymsData,
    loading,
    error,
  } = useSelector((state) => state.gyms);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <h2 className="text-lg font-semibold">Loading gyms...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-96">
        <h2 className="text-lg text-red-500">{error}</h2>
      </div>
    );
  }

  const getCurrentSub = (gym) => gym.currentSubscription;
  const getClientSince = (gym) => gym.subscriptionHistory[0]?.startDate;
  const getLifetimeRevenue = (gym) =>
    gym.subscriptionHistory.reduce((sum, s) => sum + s.amount, 0);

  // 3. SEARCH + FILTER
  const filteredGyms = gymsData.filter((gym) => {
    const matchesSearch =
      gym.gymName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gym.gymCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gym.owner?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || gym.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // ------------------------------------------------------------------
  // 4. EDIT DRAWER OPEN / SAVE
  // ------------------------------------------------------------------
  const openEditDrawer = (gym) => {
    setSelectedGym({
      ...gym,
      trainers: gym.trainers.map((t) => ({ ...t })),
      currentSubscription: { ...gym.currentSubscription },
    });
    setIsDrawerOpen(true);
  };

  const handleDrawerSave = (e) => {
    e.preventDefault();
    dispatch(updateGym(selectedGym));
    setIsDrawerOpen(false);
  };

  // ------------------------------------------------------------------
  // 5. TRAINER MANAGEMENT (inside the drawer, operates on selectedGym)
  // ------------------------------------------------------------------
  const addTrainer = () => {
    const newTrainer = { id: `TRN-${Date.now()}`, name: "", mobile: "", email: "" };
    setSelectedGym({ ...selectedGym, trainers: [...selectedGym.trainers, newTrainer] });
  };

  const updateTrainerField = (trainerId, field, value) => {
    setSelectedGym({
      ...selectedGym,
      trainers: selectedGym.trainers.map((t) =>
        t.id === trainerId ? { ...t, [field]: value } : t
      ),
    });
  };

  const removeTrainer = (trainerId) => {
    setSelectedGym({
      ...selectedGym,
      trainers: selectedGym.trainers.filter((t) => t.id !== trainerId),
    });
  };

  // ------------------------------------------------------------------
  // 6. RENEW SUBSCRIPTION
  //    Pushes a new entry into subscriptionHistory AND updates
  //    currentSubscription, so the Timeline modal picks it up too.
  // ------------------------------------------------------------------
  const renewSubscription = (months) => {
    const current = selectedGym.currentSubscription;
    const today = new Date();
    const base = new Date(current.endDate);
    const startFrom = base > today ? base : today; // don't lose remaining active days

    const newStart = new Date(startFrom);
    const newEnd = new Date(startFrom);
    newEnd.setMonth(newEnd.getMonth() + months);

    const newSub = {
      id: `SUB-${Date.now()}`,
      subscriptionPlan: current.subscriptionPlan,
      startDate: newStart.toISOString().split("T")[0],
      endDate: newEnd.toISOString().split("T")[0],
      amount: current.amount, // admin can adjust in metrics if the price changed
      paymentMode: current.paymentMode,
    };

    setSelectedGym({
      ...selectedGym,
      status: "active", // renewing reactivates the gym
      currentSubscription: newSub,
      subscriptionHistory: [...selectedGym.subscriptionHistory, newSub],
    });
  };

  // ------------------------------------------------------------------
  // 7. DELETE (gym or trainer) — routed through one confirm modal
  // ------------------------------------------------------------------
  const requestDeleteGym = (gym) => {
    setConfirmDelete({ type: "gym", gymId: gym._id, label: gym.gymName });
  };

  const requestDeleteTrainer = (trainer) => {
    setConfirmDelete({
      type: "trainer",
      gymId: selectedGym._id,
      trainerId: trainer.id,
      label: trainer.name || trainer.mobile,
    });
  };

  const confirmDeleteAction = () => {
    if (!confirmDelete) return;

    if (confirmDelete.type === "gym") {
      dispatch(deleteGym(confirmDelete.gymId));
      if (selectedGym?._id === confirmDelete.gymId) {
        setIsDrawerOpen(false);
      }
    }

    if (confirmDelete.type === "trainer") {
      removeTrainer(confirmDelete.trainerId);
    }

    setConfirmDelete(null);
  };

  // ------------------------------------------------------------------
  // 8. TIMELINE MODAL
  // ------------------------------------------------------------------
  const openTimeline = (gym) => {
    setTimelineGym(gym);
    setIsTimelineOpen(true);
  };

  const isActivePeriod = (sub) => {
    const today = new Date();
    return today >= new Date(sub.startDate) && today <= new Date(sub.endDate);
  };

  // ------------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------------
  return (
    <div className="space-y-6 relative min-h-screen pb-16">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
            All Connected Gyms
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitor subscriptions, manage trainer accounts, and renew plans.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/admin/add-gyms")}
          className="inline-flex items-center justify-center gap-1.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 rounded-xl transition-colors cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Gym
        </button>
      </header>

      {/* SEARCH + FILTER BAR */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Gym Name, ID, or Owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 shrink-0">
          {["all", "active", "inactive"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all duration-200 ${
                statusFilter === status
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* GYM CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredGyms.map((gym) => {
          const current = getCurrentSub(gym);
          return (
            <div
              key={gym._id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg leading-snug">{gym.gymName}</h3>
                    <span className="text-xs text-slate-400 font-mono tracking-wider">{gym.gymCode}</span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold capitalize border ${
                      gym.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {gym.status === "active" ? (
                      <ShieldCheck className="h-3.5 w-3.5" />
                    ) : (
                      <ShieldAlert className="h-3.5 w-3.5" />
                    )}
                    {gym.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-slate-600 border-t border-slate-50 pt-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-slate-700">{gym.owner.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span>+91 {gym.owner.mobile}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="truncate">{gym.owner.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span>
                      {gym.trainers.length} trainer{gym.trainers.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Current plan pulled from the latest subscriptionHistory entry */}
                <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-xs text-slate-500 border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span>Current Plan:</span>
                    <span className="font-semibold text-slate-700">{current.subscriptionPlan}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Start Date:</span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {current.startDate}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>End Date:</span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {current.endDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card footer actions: Edit, Timeline, Delete.
                  `flex-1` makes all 3 buttons share width equally so
                  they never overflow on narrow phone screens — no
                  fixed px-3 squeeze fighting for space. */}
              <div className="bg-slate-50/50 p-3 sm:p-4 border-t border-slate-100 flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => openEditDrawer(gym)}
                  className="flex-1 inline-flex items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/80 px-2 sm:px-3 py-2 rounded-xl transition-all cursor-pointer focus:outline-none"
                >
                  <Edit3 className="h-3.5 w-3.5 shrink-0" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => openTimeline(gym)}
                  className="flex-1 inline-flex items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 px-2 sm:px-3 py-2 rounded-xl transition-all cursor-pointer focus:outline-none"
                >
                  <History className="h-3.5 w-3.5 shrink-0" />
                  <span>Timeline</span>
                </button>

                <button
                  type="button"
                  onClick={() => requestDeleteGym(gym)}
                  className="flex-1 inline-flex items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100/80 px-2 sm:px-3 py-2 rounded-xl transition-all cursor-pointer focus:outline-none"
                >
                  <Trash2 className="h-3.5 w-3.5 shrink-0" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================================================================
          EDIT DRAWER
      ================================================================ */}
      {isDrawerOpen && selectedGym && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="flex-1 cursor-pointer" onClick={() => setIsDrawerOpen(false)} />

          <div className="w-full max-w-lg bg-white h-screen shadow-2xl p-4 sm:p-6 overflow-y-auto border-l border-slate-100">
            <form onSubmit={handleDrawerSave} className="space-y-5 sm:space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
                    {selectedGym.gymName}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Manage subscription, owner, and trainer accounts
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* ---------------- STATUS ---------------- */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Operational Status
                </label>
                <select
                  value={selectedGym.status}
                  onChange={(e) => setSelectedGym({ ...selectedGym, status: e.target.value })}
                  className="mt-1.5 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* ---------------- RENEW SUBSCRIPTION ----------------
                  Pushes a new entry into subscriptionHistory (see
                  renewSubscription above) instead of just overwriting
                  a date — this is what the Timeline modal reads from. */}
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 uppercase tracking-wider">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Renew Subscription
                </label>
                <p className="text-xs text-slate-500">
                  Current end date:{" "}
                  <span className="font-semibold text-slate-700">
                    {getCurrentSub(selectedGym).endDate}
                  </span>
                </p>
                <div className="flex gap-2 flex-wrap">
                  {[1, 3, 6, 12].map((months) => (
                    <button
                      key={months}
                      type="button"
                      onClick={() => renewSubscription(months)}
                      className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      +{months} {months === 1 ? "month" : "months"}
                    </button>
                  ))}
                </div>
              </div>

              {/* ---------------- METRICS ----------------
                  Read-only — Members and Enquiries are counts
                  generated by app activity, not something the admin
                  edits by hand from this drawer. */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Facility Metrics
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[11px] text-slate-500">Members</span>
                    <p className="mt-1 font-bold text-slate-800 text-lg">
                      {selectedGym.totalMembers}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[11px] text-slate-500">Enquiries</span>
                    <p className="mt-1 font-bold text-slate-800 text-lg">
                      {selectedGym.enquiries}
                    </p>
                  </div>
                </div>
              </div>

              {/* ---------------- ADDRESS ---------------- */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Address Location
                </label>
                <textarea
                  rows="2"
                  value={selectedGym.address}
                  onChange={(e) => setSelectedGym({ ...selectedGym, address: e.target.value })}
                  className="mt-1.5 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* ---------------- OWNER DETAILS ----------------
                  Matches the Owner schema (User base fields): name,
                  mobile, email — all required there, so kept required
                  here too. No password field — it's hashed server-side
                  and never editable from the admin panel. gymId isn't
                  shown since it's fixed to this gym already. */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Owner Details
                </label>
                <div>
                  <span className="text-[11px] text-slate-500">Owner Name</span>
                  <input
                    type="text"
                    required
                    value={selectedGym.owner.name}
                    onChange={(e) =>
                      setSelectedGym({
                        ...selectedGym,
                        owner: { ...selectedGym.owner, name: e.target.value },
                      })
                    }
                    className="mt-1 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500">Owner Mobile Number</span>
                  <input
                    type="text"
                    required
                    value={selectedGym.owner.mobile}
                    onChange={(e) =>
                      setSelectedGym({
                        ...selectedGym,
                        owner: { ...selectedGym.owner, mobile: e.target.value },
                      })
                    }
                    className="mt-1 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500">Owner Email</span>
                  <input
                    type="email"
                    required
                    value={selectedGym.owner.email}
                    onChange={(e) =>
                      setSelectedGym({
                        ...selectedGym,
                        owner: { ...selectedGym.owner, email: e.target.value },
                      })
                    }
                    className="mt-1 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* ---------------- TRAINERS (MULTIPLE) ----------------
                  Password field removed per-trainer — only name and
                  mobile number stay editable here; the trainer's own
                  id remains fixed. */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Trainers ({selectedGym.trainers.length})
                  </label>
                  <button
                    type="button"
                    onClick={addTrainer}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Trainer
                  </button>
                </div>

                {selectedGym.trainers.length === 0 && (
                  <p className="text-xs text-slate-400 italic">No trainers added yet.</p>
                )}

                <div className="space-y-3">
                  {selectedGym.trainers.map((trainer) => (
                    <div
                      key={trainer.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          placeholder="Trainer name"
                          required
                          value={trainer.name}
                          onChange={(e) => updateTrainerField(trainer.id, "name", e.target.value)}
                          className="flex-1 bg-transparent text-sm font-semibold text-slate-800 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => requestDeleteTrainer(trainer)}
                          className="text-slate-400 hover:text-rose-600 transition-colors"
                          aria-label="Remove trainer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Mobile number"
                        required
                        value={trainer.mobile}
                        onChange={(e) => updateTrainerField(trainer.id, "mobile", e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-500"
                      />

                      <input
                        type="email"
                        placeholder="Email address"
                        required
                        value={trainer.email}
                        onChange={(e) => updateTrainerField(trainer.id, "email", e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* ---------------- FOOTER ACTIONS ----------------
                  Stacked on mobile (column-reverse so Save ends up on
                  top, closest to the thumb) since 3 buttons in one row
                  would overflow a narrow phone. Row layout returns at
                  sm: and up where there's room. */}
              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => requestDeleteGym(selectedGym)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Gym
                </button>

                <div className="grid grid-cols-2 sm:flex sm:items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================
          TIMELINE MODAL
          Opened via the "Timeline" button on each gym card. Shows every
          subscription period for that gym, newest first, read-only.
      ================================================================ */}
      {isTimelineOpen && timelineGym && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-3 sm:px-4 py-6 sm:py-8">
          {/* Backdrop closer */}
          <div className="absolute inset-0" onClick={() => setIsTimelineOpen(false)} />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                  {timelineGym.gymName}
                </h2>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3" />
                  Client since {getClientSince(timelineGym)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTimelineOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Summary strip */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl border border-slate-100 p-3">
                <span className="text-[11px] text-slate-400">Lifetime Revenue</span>
                <p className="text-base font-bold text-slate-800 mt-0.5 flex items-center">
                  <IndianRupee className="h-3.5 w-3.5" />
                  {getLifetimeRevenue(timelineGym).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl border border-slate-100 p-3">
                <span className="text-[11px] text-slate-400">Total Plans Purchased</span>
                <p className="text-base font-bold text-slate-800 mt-0.5">
                  {timelineGym.subscriptionHistory.length}
                </p>
              </div>
            </div>

            {/* Timeline list — newest first */}
            <ol className="relative border-l-2 border-slate-100 ml-2">
              {[...timelineGym.subscriptionHistory].reverse().map((sub) => {
                const active = isActivePeriod(sub);
                return (
                  <li key={sub.id} className="mb-6 ml-6 last:mb-0">
                    <span
                      className={`absolute -left-[9px] flex items-center justify-center w-4 h-4 rounded-full ring-4 ring-white ${
                        active ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    />
                    <div
                      className={`p-3.5 rounded-xl border ${
                        active
                          ? "bg-emerald-50/60 border-emerald-200"
                          : "bg-slate-50 border-slate-100"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">
                            {sub.subscriptionPlan} Plan
                          </span>
                          {active && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </span>
                          )}
                        </div>
                        <span className="flex items-center gap-1 text-sm font-bold text-slate-700">
                          <IndianRupee className="h-3 w-3" />
                          {sub.amount.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 mt-1.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {sub.startDate} → {sub.endDate}
                        </span>
                        <span>Paid via {sub.paymentMode}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}

      {/* ================================================================
          SHARED CONFIRM-DELETE MODAL
      ================================================================ */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <ShieldAlert className="h-5 w-5" />
              <h3 className="font-bold text-slate-800">
                {confirmDelete.type === "gym" ? "Delete this gym?" : "Remove this trainer?"}
              </h3>
            </div>
            <p className="text-sm text-slate-500">
              {confirmDelete.type === "gym"
                ? `This will permanently remove "${confirmDelete.label}" and all its data, including trainer accounts. This can't be undone.`
                : `"${confirmDelete.label}" will lose access immediately. This can't be undone.`}
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteAction}
                className="px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors"
              >
                {confirmDelete.type === "gym" ? "Delete Gym" : "Remove Trainer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}