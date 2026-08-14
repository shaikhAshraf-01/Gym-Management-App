import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
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
import WhatsAppRenewMessagePopup from "./WhatsAppRenewMessagePopup";

export default function AllGyms() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchGyms());
  }, [dispatch]);

  // ------------------------------------------------------------------
  // 1. TOP LEVEL STATE
  // ------------------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedGym, setSelectedGym] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Gym currently open in the TIMELINE modal
  const [timelineGym, setTimelineGym] = useState(null);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

  // Confirmation state for destructive actions
  const [confirmDelete, setConfirmDelete] = useState(null);

  // ------------------------------------------------------------------
  // WHATSAPP RENEWAL STATE
  // ------------------------------------------------------------------
  // This is only populated after a renewal has been selected.
  // The popup is shown only after Save Changes succeeds.
  const [renewalWhatsApp, setRenewalWhatsApp] = useState(null);

  // Renewal form fields — separate from selectedGym so the drawer can
  // show "pending renewal" values without touching the gym's live
  // data until "Apply Renewal" is pressed.
  const [renewPlan, setRenewPlan] = useState("Basic");
  const [renewDurationMonths, setRenewDurationMonths] = useState(1);
  const [renewStartDate, setRenewStartDate] = useState("");
  const [renewEndDate, setRenewEndDate] = useState("");
  const [renewAmount, setRenewAmount] = useState("");
  const [renewPaymentMode, setRenewPaymentMode] = useState("UPI");
  const [renewalPending, setRenewalPending] = useState(false);

  // Auto-calculate end date from start date + duration, but the admin
  // can still override it manually afterwards (input isn't readOnly).
  useEffect(() => {
    if (!renewStartDate) return;

    const startDate = new Date(`${renewStartDate}T12:00:00`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + Number(renewDurationMonths));

    const year = endDate.getFullYear();
    const month = String(endDate.getMonth() + 1).padStart(2, "0");
    const day = String(endDate.getDate()).padStart(2, "0");

    setRenewEndDate(`${year}-${month}-${day}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renewDurationMonths, renewStartDate]);

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

  const getClientSince = (gym) =>
    gym.subscriptionHistory[0]?.startDate;

  const getLifetimeRevenue = (gym) =>
    gym.subscriptionHistory.reduce(
      (sum, s) => sum + s.amount,
      0
    );

  // ------------------------------------------------------------------
  // 3. SEARCH + FILTER
  // ------------------------------------------------------------------
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
  const formatDateInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Renewal form fields — separate from selectedGym so the drawer can
  // show "pending renewal" values without touching the gym's live
  // data until "Apply Renewal" is pressed.

  const calculateDefaultRenewStartDate = (gym) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate = new Date(today);
    const currentEndDate = gym?.currentSubscription?.endDate;

    if (currentEndDate) {
      const currentExpiry = new Date(currentEndDate);
      currentExpiry.setHours(0, 0, 0, 0);

      if (currentExpiry >= today) {
        startDate = new Date(currentExpiry);
        startDate.setDate(startDate.getDate() + 1);
      }
    }

    return formatDateInput(startDate);
  };

  const openEditDrawer = (gym) => {
    setSelectedGym({
      ...gym,
      trainers: gym.trainers.map((t) => ({ ...t })),
      currentSubscription: { ...gym.currentSubscription },
    });

    // Reset the renewal form to reflect the gym's current plan/amount
    // so "Apply Renewal" defaults sensibly if the admin doesn't touch
    // the plan or duration at all.
    setRenewPlan(gym.currentSubscription?.subscriptionPlan || "Basic");
    setRenewDurationMonths(gym.currentSubscription?.durationMonths || 1);
    setRenewStartDate(calculateDefaultRenewStartDate(gym));
    setRenewEndDate("");
    setRenewAmount(gym.currentSubscription?.amount || "");
    setRenewPaymentMode(gym.currentSubscription?.paymentMode || "UPI");
    setRenewalPending(false);

    setIsDrawerOpen(true);
  };

  const handleDrawerSave = async (e) => {
    e.preventDefault();

    try {
      // --------------------------------------------------------------
      // EXISTING BACKEND UPDATE
      // --------------------------------------------------------------
      // We are still using your existing updateGym thunk.
      const result = await dispatch(updateGym(selectedGym));

      // --------------------------------------------------------------
      // ONLY SHOW WHATSAPP AFTER BACKEND SUCCESS
      // --------------------------------------------------------------
      if (
        renewalWhatsApp &&
        result?.meta?.requestStatus === "fulfilled"
      ) {
        setIsDrawerOpen(false);
        setRenewalWhatsApp(renewalWhatsApp);
        return;
      }

      // Normal Save Changes flow
      setIsDrawerOpen(false);
    } catch (err) {
      console.error("Failed to save gym:", err);
    }
  };

  // ------------------------------------------------------------------
  // 5. TRAINER MANAGEMENT
  // ------------------------------------------------------------------
  const addTrainer = () => {
    const newTrainer = {
      id: `TRN-${Date.now()}`,
      name: "",
      mobile: "",
      email: "",
    };

    setSelectedGym({
      ...selectedGym,
      trainers: [...selectedGym.trainers, newTrainer],
    });
  };

  const updateTrainerField = (trainerId, field, value) => {
    setSelectedGym({
      ...selectedGym,
      trainers: selectedGym.trainers.map((t) =>
        t.id === trainerId
          ? { ...t, [field]: value }
          : t
      ),
    });
  };

  const removeTrainer = (trainerId) => {
    setSelectedGym({
      ...selectedGym,
      trainers: selectedGym.trainers.filter(
        (t) => t.id !== trainerId
      ),
    });
  };

  // ------------------------------------------------------------------
  // 6. RENEW / CHANGE SUBSCRIPTION
  // ------------------------------------------------------------------
  // Replaces the old fixed-month-only renewal — now the admin can also
  // change the plan (Basic/Plus/Pro) and freely edit both the start
  // date and the end date before applying.
  const applyRenewal = () => {
    if (!renewStartDate || !renewEndDate || !renewAmount) return;

    const newSub = {
      id: `SUB-${Date.now()}`,
      subscriptionPlan: renewPlan,
      durationMonths: Number(renewDurationMonths),
      startDate: renewStartDate,
      endDate: renewEndDate,
      amount: Number(renewAmount),
      paymentMode: renewPaymentMode,
    };

    setSelectedGym({
      ...selectedGym,
      status: "active",
      currentSubscription: newSub,
      subscriptionHistory: [
        ...selectedGym.subscriptionHistory,
        newSub,
      ],
    });

    setRenewalPending(true);

    // Popup will NOT open here. It will open only after Save Changes
    // succeeds.
    setRenewalWhatsApp({
      phone: selectedGym.owner?.mobile,
      gymName: selectedGym.gymName,
      plan: renewPlan,
      months: renewDurationMonths,
      amount: renewAmount,
      newEndDate: newSub.endDate,
    });
  };

  // ------------------------------------------------------------------
  // 7. DELETE
  // ------------------------------------------------------------------
  const requestDeleteGym = (gym) => {
    setConfirmDelete({
      type: "gym",
      gymId: gym._id,
      label: gym.gymName,
    });
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

    return (
      today >= new Date(sub.startDate) &&
      today <= new Date(sub.endDate)
    );
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
                    <h3 className="font-bold text-slate-800 text-lg leading-snug">
                      {gym.gymName}
                    </h3>

                    <span className="text-xs text-slate-400 font-mono tracking-wider">
                      {gym.gymCode}
                    </span>
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
                    <span className="font-medium text-slate-700">
                      {gym.owner.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span>+91 {gym.owner.mobile}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="truncate">
                      {gym.owner.email}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-400" />

                    <span>
                      {gym.trainers.length} trainer
                      {gym.trainers.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* CURRENT PLAN */}
                <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-xs text-slate-500 border border-slate-100">

                  <div className="flex justify-between items-center">
                    <span>Current Plan:</span>

                    <span className="font-semibold text-slate-700">
                      {current.subscriptionPlan}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Start Date:</span>

                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {current.startDate}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>End Date:</span>

                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {current.endDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD FOOTER */}
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

          <div
            className="flex-1 cursor-pointer"
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className="w-full max-w-lg bg-white h-screen shadow-2xl p-4 sm:p-6 overflow-y-auto border-l border-slate-100">

            <form
              onSubmit={handleDrawerSave}
              className="space-y-5 sm:space-y-6"
            >

              {/* HEADER */}
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

              {/* STATUS */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Operational Status
                </label>

                <select
                  value={selectedGym.status}
                  onChange={(e) =>
                    setSelectedGym({
                      ...selectedGym,
                      status: e.target.value,
                    })
                  }
                  className="mt-1.5 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* CURRENT SUBSCRIPTION — DIRECT EDIT
                  Corrects the existing plan/start/end date in place.
                  Unlike "Renew / Change Subscription" below, this does
                  NOT create a new subscriptionHistory entry and does
                  NOT trigger the WhatsApp renewal popup — use it for
                  fixing a mistake, not for an actual renewal. */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">

                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <Edit3 className="h-3.5 w-3.5" />
                  Current Subscription
                </label>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Current Plan */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Plan
                    </label>
                    <select
                      value={getCurrentSub(selectedGym).subscriptionPlan}
                      onChange={(e) =>
                        setSelectedGym({
                          ...selectedGym,
                          currentSubscription: {
                            ...selectedGym.currentSubscription,
                            subscriptionPlan: e.target.value,
                          },
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Basic">Basic</option>
                      <option value="Plus">Plus</option>
                      <option value="Pro">Pro</option>
                    </select>
                  </div>

                  <div />

                  {/* Current Start Date */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={getCurrentSub(selectedGym).startDate}
                      onChange={(e) =>
                        setSelectedGym({
                          ...selectedGym,
                          currentSubscription: {
                            ...selectedGym.currentSubscription,
                            startDate: e.target.value,
                          },
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Current End Date */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={getCurrentSub(selectedGym).endDate}
                      onChange={(e) =>
                        setSelectedGym({
                          ...selectedGym,
                          currentSubscription: {
                            ...selectedGym.currentSubscription,
                            endDate: e.target.value,
                          },
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-slate-400">
                  Corrects the current subscription only — save changes below to apply. This doesn't add a new plan to the timeline.
                </p>
              </div>

              {/* RENEW / CHANGE SUBSCRIPTION */}
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 space-y-3">

                <label className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 uppercase tracking-wider">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Renew / Change Subscription
                </label>

                <p className="text-xs text-slate-500">
                  Current plan:{" "}
                  <span className="font-semibold text-slate-700">
                    {getCurrentSub(selectedGym).subscriptionPlan}
                  </span>
                  {" · "}Current end date:{" "}
                  <span className="font-semibold text-slate-700">
                    {getCurrentSub(selectedGym).endDate}
                  </span>
                </p>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Plan */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Plan
                    </label>
                    <select
                      value={renewPlan}
                      onChange={(e) => setRenewPlan(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Basic">Basic</option>
                      <option value="Plus">Plus</option>
                      <option value="Pro">Pro</option>
                    </select>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Duration
                    </label>
                    <select
                      value={renewDurationMonths}
                      onChange={(e) => setRenewDurationMonths(Number(e.target.value))}
                      className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                    >
                      <option value={1}>1 Month</option>
                      <option value={3}>3 Months</option>
                      <option value={6}>6 Months</option>
                      <option value={12}>1 Year</option>
                    </select>
                  </div>

                  {/* Start Date — editable, defaults to today (expired)
                      or day after current expiry (still active) */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={renewStartDate}
                      onChange={(e) => setRenewStartDate(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-sm text-indigo-700 font-semibold focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* End Date — auto-calculated from Start + Duration,
                      but freely editable if a custom date is needed */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={renewEndDate}
                      onChange={(e) => setRenewEndDate(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-sm text-indigo-700 font-semibold focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Amount
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={renewAmount}
                      onChange={(e) => setRenewAmount(e.target.value)}
                      placeholder="₹ amount"
                      className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Payment Mode */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={renewPaymentMode}
                      onChange={(e) => setRenewPaymentMode(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="UPI">UPI</option>
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={applyRenewal}
                  className="w-full px-3 py-2 text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Apply Renewal
                </button>

                {renewalPending && (
                  <p className="text-[11px] text-indigo-600 pt-1">
                    Renewal set to {renewPlan} · {renewStartDate} → {renewEndDate}. Save Changes to complete it.
                  </p>
                )}
              </div>

              {/* METRICS */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Facility Metrics
                </label>

                <div className="grid grid-cols-2 gap-3">

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[11px] text-slate-500">
                      Members
                    </span>

                    <p className="mt-1 font-bold text-slate-800 text-lg">
                      {selectedGym.totalMembers}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[11px] text-slate-500">
                      Enquiries
                    </span>

                    <p className="mt-1 font-bold text-slate-800 text-lg">
                      {selectedGym.enquiries}
                    </p>
                  </div>

                </div>
              </div>

              {/* ADDRESS */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Address Location
                </label>

                <textarea
                  rows="2"
                  value={selectedGym.address}
                  onChange={(e) =>
                    setSelectedGym({
                      ...selectedGym,
                      address: e.target.value,
                    })
                  }
                  className="mt-1.5 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* OWNER DETAILS */}
              <div className="space-y-3">

                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Owner Details
                </label>

                <div>
                  <span className="text-[11px] text-slate-500">
                    Owner Name
                  </span>

                  <input
                    type="text"
                    required
                    value={selectedGym.owner.name}
                    onChange={(e) =>
                      setSelectedGym({
                        ...selectedGym,
                        owner: {
                          ...selectedGym.owner,
                          name: e.target.value,
                        },
                      })
                    }
                    className="mt-1 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-slate-500">
                    Owner Mobile Number
                  </span>

                  <input
                    type="text"
                    required
                    value={selectedGym.owner.mobile}
                    onChange={(e) =>
                      setSelectedGym({
                        ...selectedGym,
                        owner: {
                          ...selectedGym.owner,
                          mobile: e.target.value,
                        },
                      })
                    }
                    className="mt-1 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-slate-500">
                    Owner Email
                  </span>

                  <input
                    type="email"
                    required
                    value={selectedGym.owner.email}
                    onChange={(e) =>
                      setSelectedGym({
                        ...selectedGym,
                        owner: {
                          ...selectedGym.owner,
                          email: e.target.value,
                        },
                      })
                    }
                    className="mt-1 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

              </div>

              {/* TRAINERS */}
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
                  <p className="text-xs text-slate-400 italic">
                    No trainers added yet.
                  </p>
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
                          onChange={(e) =>
                            updateTrainerField(
                              trainer.id,
                              "name",
                              e.target.value
                            )
                          }
                          className="flex-1 bg-transparent text-sm font-semibold text-slate-800 focus:outline-none"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            requestDeleteTrainer(trainer)
                          }
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
                        onChange={(e) =>
                          updateTrainerField(
                            trainer.id,
                            "mobile",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-500"
                      />

                      <input
                        type="email"
                        placeholder="Email address"
                        required
                        value={trainer.email}
                        onChange={(e) =>
                          updateTrainerField(
                            trainer.id,
                            "email",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                      />

                    </div>
                  ))}

                </div>
              </div>

              {/* FOOTER ACTIONS */}
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
                    onClick={() => {
                      setIsDrawerOpen(false);
                      setRenewalWhatsApp(null);
                    }}
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
      ================================================================ */}
      {isTimelineOpen && timelineGym && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-3 sm:px-4 py-6 sm:py-8">

          <div
            className="absolute inset-0"
            onClick={() => setIsTimelineOpen(false)}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">

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

            <div className="grid grid-cols-2 gap-3">

              <div className="bg-slate-50 rounded-xl border border-slate-100 p-3">
                <span className="text-[11px] text-slate-400">
                  Lifetime Revenue
                </span>

                <p className="text-base font-bold text-slate-800 mt-0.5 flex items-center">
                  <IndianRupee className="h-3.5 w-3.5" />
                  {getLifetimeRevenue(timelineGym).toLocaleString("en-IN")}
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-100 p-3">
                <span className="text-[11px] text-slate-400">
                  Total Plans Purchased
                </span>

                <p className="text-base font-bold text-slate-800 mt-0.5">
                  {timelineGym.subscriptionHistory.length}
                </p>
              </div>

            </div>

            <ol className="relative border-l-2 border-slate-100 ml-2">

              {[...timelineGym.subscriptionHistory]
                .reverse()
                .map((sub) => {

                  const active = isActivePeriod(sub);

                  return (
                    <li
                      key={sub.id}
                      className="mb-6 ml-6 last:mb-0"
                    >

                      <span
                        className={`absolute -left-[9px] flex items-center justify-center w-4 h-4 rounded-full ring-4 ring-white ${
                          active
                            ? "bg-emerald-500"
                            : "bg-slate-300"
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

                          <span>
                            Paid via {sub.paymentMode}
                          </span>

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
          WHATSAPP RENEWAL POPUP
      ================================================================ */}
      <WhatsAppRenewMessagePopup
        isOpen={!!renewalWhatsApp}
        onClose={() => setRenewalWhatsApp(null)}
        phone={renewalWhatsApp?.phone}
        gymName={renewalWhatsApp?.gymName}
        plan={renewalWhatsApp?.plan}
        months={renewalWhatsApp?.months}
        amount={renewalWhatsApp?.amount}
        newEndDate={renewalWhatsApp?.newEndDate}
      />

      {/* ================================================================
          SHARED CONFIRM-DELETE MODAL
      ================================================================ */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 px-4">

          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 sm:p-6 space-y-4">

            <div className="flex items-center gap-2 text-rose-600">

              <ShieldAlert className="h-5 w-5" />

              <h3 className="font-bold text-slate-800">
                {confirmDelete.type === "gym"
                  ? "Delete this gym?"
                  : "Remove this trainer?"}
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
                {confirmDelete.type === "gym"
                  ? "Delete Gym"
                  : "Remove Trainer"}
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}