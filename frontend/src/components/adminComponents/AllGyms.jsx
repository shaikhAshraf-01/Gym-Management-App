import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useBackHandler } from "../../hooks/useBackHandler";
import {
  Search,
  Phone,
  Mail,
  Calendar,
  Users,
  Edit3,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  RefreshCw,
  History,
  UserCog,
  Eye,
} from "lucide-react";
import { fetchGyms, deleteGym } from "../../redux/slices/gymSlice";
import EditGymModal from "./EditGymModal";
import RenewGymModal from "./RenewGymModal";
import ManageTrainersModal from "./ManageTrainersModal";
import GymTimelineModal from "./GymTimelineModal";

// AllGyms is now only the list: search, filters, cards and the shared
// delete confirmation. Each action opens its own component:
//   View     -> GymDetails page     (overview, members, enquiries, sales...)
//   Edit     -> EditGymModal        (status, address, owner)
//   Renew    -> RenewGymModal       (renew, or edit the current plan)
//   Trainers -> ManageTrainersModal
//   Timeline -> GymTimelineModal    (read-only history)
export default function AllGyms() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    gyms: gymsData = [],
    loading,
    error,
  } = useSelector((state) => state.gyms || state.gym);

  // Only hit the server if the local Redux store is completely empty.
  useEffect(() => {
    if (!gymsData || gymsData.length === 0) {
      dispatch(fetchGyms());
    }
  }, [dispatch, gymsData]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Which action modal is open: { type: "edit"|"renew"|"trainers"|"timeline", gymId }
  const [active, setActive] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const closeActive = () => setActive(null);
  const activeGym = active
    ? gymsData.find((g) => g._id === active.gymId)
    : null;

  useBackHandler(!!confirmDelete, () => setConfirmDelete(null));

  if (loading && gymsData.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <h2 className="text-sm font-medium text-slate-400">
            Loading gyms data...
          </h2>
        </div>
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

  const filteredGyms = gymsData.filter((gym) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      gym.gymName?.toLowerCase().includes(q) ||
      gym.gymCode?.toLowerCase().includes(q) ||
      gym.owner?.name?.toLowerCase().includes(q);

    const matchesStatus = statusFilter === "all" || gym.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const requestDeleteGym = (gym) =>
    setConfirmDelete({ gymId: gym._id, label: gym.gymName });

  const confirmDeleteAction = () => {
    if (!confirmDelete) return;
    dispatch(deleteGym(confirmDelete.gymId));
    if (active?.gymId === confirmDelete.gymId) closeActive();
    setConfirmDelete(null);
  };

  const footerBtn =
    "inline-flex items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold px-2 sm:px-3 py-2 rounded-xl transition-all cursor-pointer focus:outline-none";

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
          const current = gym.currentSubscription;

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
                      {gym.owner?.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span>+91 {gym.owner?.mobile}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="truncate">{gym.owner?.email}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span>
                      {gym.trainers.length} trainer
                      {gym.trainers.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span>
                      {gym.totalMembers ?? 0} member
                      {(gym.totalMembers ?? 0) !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* CURRENT PLAN */}
                <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-xs text-slate-500 border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span>Current Plan:</span>
                    <span className="font-semibold text-slate-700">
                      {current?.subscriptionPlan}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Start Date:</span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {current?.startDate}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>End Date:</span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {current?.endDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD FOOTER */}
              <div className="bg-slate-50/50 p-3 sm:p-4 border-t border-slate-100 space-y-1.5 sm:space-y-2">
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/all-gyms/${gym._id}`)}
                    className={`${footerBtn} text-white bg-indigo-600 hover:bg-indigo-700`}
                  >
                    <Eye className="h-3.5 w-3.5 shrink-0" />
                    <span>View</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActive({ type: "edit", gymId: gym._id })}
                    className={`${footerBtn} text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/80`}
                  >
                    <Edit3 className="h-3.5 w-3.5 shrink-0" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActive({ type: "renew", gymId: gym._id })}
                    className={`${footerBtn} text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100/80`}
                  >
                    <RefreshCw className="h-3.5 w-3.5 shrink-0" />
                    <span>Renew</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setActive({ type: "trainers", gymId: gym._id })
                    }
                    className={`${footerBtn} text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100/80`}
                  >
                    <UserCog className="h-3.5 w-3.5 shrink-0" />
                    <span>Trainers</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setActive({ type: "timeline", gymId: gym._id })
                    }
                    className={`${footerBtn} text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80`}
                  >
                    <History className="h-3.5 w-3.5 shrink-0" />
                    <span>Timeline</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => requestDeleteGym(gym)}
                    className={`${footerBtn} text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100/80`}
                  >
                    <Trash2 className="h-3.5 w-3.5 shrink-0" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ACTION MODALS — key={gymId} so each gym gets fresh form state */}
      {active?.type === "edit" && activeGym && (
        <EditGymModal
          key={activeGym._id}
          gym={activeGym}
          onClose={closeActive}
          onRequestDelete={requestDeleteGym}
        />
      )}

      {active?.type === "renew" && activeGym && (
        <RenewGymModal
          key={activeGym._id}
          gym={activeGym}
          onClose={closeActive}
        />
      )}

      {active?.type === "trainers" && activeGym && (
        <ManageTrainersModal
          key={activeGym._id}
          gym={activeGym}
          onClose={closeActive}
        />
      )}

      {active?.type === "timeline" && activeGym && (
        <GymTimelineModal gym={activeGym} onClose={closeActive} />
      )}

      {/* CONFIRM DELETE GYM */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <ShieldAlert className="h-5 w-5" />
              <h3 className="font-bold text-slate-800">Delete this gym?</h3>
            </div>

            <p className="text-sm text-slate-500">
              This will permanently remove "{confirmDelete.label}" and all its
              data, including trainer accounts. This can't be undone.
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
                Delete Gym
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}