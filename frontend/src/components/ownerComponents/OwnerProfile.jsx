import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  BadgeCheck,
  Camera,
  Trash2,
  LogOut,
  Users,
  Plus,
  Pencil,
  X,
  Check,
  FileText,
} from "lucide-react";

import { performLogout } from "../../redux/slices/authSlice";
import {
  fetchOwnerProfile,
  uploadGymLogo,
  removeGymLogo,
  clearUploadError,
  addOwnerTrainer,
  updateOwnerTrainer,
  removeOwnerTrainer,
  clearTrainerActionError,
  updateGymGstDetails,
  clearGstActionError,
} from "../../redux/slices/ownerSlice";

const EMPTY_TRAINER_FORM = { name: "", mobile: "", email: "" };

// Small add/edit form shared by both flows — kept inline here rather
// than a separate file since it's only ever used from this page.
function TrainerForm({ initial, onCancel, onSubmit, submitting }) {
  const [form, setForm] = useState(initial || EMPTY_TRAINER_FORM);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-2.5 rounded-xl border border-slate-800 bg-slate-950 p-3.5"
    >
      <input
        required
        placeholder="Trainer name"
        value={form.name}
        onChange={handleChange("name")}
        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
      />
      <input
        required
        placeholder="Mobile number"
        value={form.mobile}
        onChange={handleChange("mobile")}
        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
      />
      <input
        required
        type="email"
        placeholder="Email address"
        value={form.email}
        onChange={handleChange("email")}
        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
      />
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-cyan-500 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
        >
          <Check size={14} /> {submitting ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-800 py-2 text-sm font-bold text-slate-300 hover:bg-slate-700"
        >
          <X size={14} /> Cancel
        </button>
      </div>
    </form>
  );
}

function TrainersSection() {
  const dispatch = useDispatch();
  const { trainers, trainerActionLoading, trainerActionError } = useSelector(
    (state) => state.owner,
  );

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);

  const handleAdd = async (form) => {
    try {
      await dispatch(addOwnerTrainer(form)).unwrap();
      setAdding(false);
    } catch {
      // trainerActionError banner below already shows the failure.
    }
  };

  const handleUpdate = async (trainerId, form) => {
    try {
      await dispatch(updateOwnerTrainer({ trainerId, ...form })).unwrap();
      setEditingId(null);
    } catch {
      // trainerActionError banner below already shows the failure.
    }
  };

  const handleRemove = async (trainerId) => {
    try {
      await dispatch(removeOwnerTrainer(trainerId)).unwrap();
    } finally {
      setConfirmingDeleteId(null);
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase text-slate-500">
          <Users size={16} className="text-cyan-400" /> Trainers
        </h2>
        {!adding && (
          <button
            onClick={() => {
              setAdding(true);
              setEditingId(null);
            }}
            className="flex items-center gap-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1.5 text-xs font-bold text-cyan-400 hover:bg-cyan-500/20"
          >
            <Plus size={14} /> Add Trainer
          </button>
        )}
      </div>

      {trainerActionError && (
        <div className="mb-3 flex items-start justify-between gap-3 rounded-xl border border-rose-900/60 bg-rose-950/40 p-3">
          <p className="text-sm font-medium text-rose-300">{trainerActionError}</p>
          <button
            onClick={() => dispatch(clearTrainerActionError())}
            className="shrink-0 text-xs font-bold text-red-400 hover:text-red-600"
          >
            Dismiss
          </button>
        </div>
      )}

      {adding && (
        <div className="mb-3">
          <TrainerForm
            onCancel={() => setAdding(false)}
            onSubmit={handleAdd}
            submitting={trainerActionLoading}
          />
        </div>
      )}

      {trainers.length === 0 && !adding ? (
        <p className="py-4 text-center text-xs text-slate-500">
          No trainers added yet.
        </p>
      ) : (
        <div className="space-y-2.5">
          {trainers.map((trainer) =>
            editingId === trainer.id ? (
              <TrainerForm
                key={trainer.id}
                initial={{
                  name: trainer.name,
                  mobile: trainer.mobile,
                  email: trainer.email,
                }}
                onCancel={() => setEditingId(null)}
                onSubmit={(form) => handleUpdate(trainer.id, form)}
                submitting={trainerActionLoading}
              />
            ) : (
              <div
                key={trainer.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3.5"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-100">{trainer.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {trainer.mobile} · {trainer.email}
                  </p>
                </div>

                {confirmingDeleteId === trainer.id ? (
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      onClick={() => handleRemove(trainer.id)}
                      disabled={trainerActionLoading}
                      className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-red-500 disabled:opacity-60"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmingDeleteId(null)}
                      className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      onClick={() => {
                        setEditingId(trainer.id);
                        setAdding(false);
                      }}
                      className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-2 text-blue-400 hover:bg-blue-500/20"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setConfirmingDeleteId(trainer.id)}
                      className="rounded-lg bg-red-500/10 border border-red-500/20 p-2 text-red-400 hover:bg-red-500/20"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

export default function OwnerProfile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const photoInputRef = useRef(null);

  const { owner, gym, currentSubscription, loading, uploading, error, uploadError, gstActionLoading, gstActionError } =
    useSelector((state) => state.owner);

  const [editingGst, setEditingGst] = useState(false);
  const [gstInput, setGstInput] = useState("");

  // Only fetch when the profile hasn't been loaded yet — previously
  // this re-ran on every mount, causing the page to reload every time
  // the owner navigated back to it even though nothing had changed.
  useEffect(() => {
    if (!gym || !owner) {
      dispatch(fetchOwnerProfile());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const handleStartEditGst = () => {
    setGstInput(gym?.gstNumber || "");
    dispatch(clearGstActionError());
    setEditingGst(true);
  };

  const handleCancelEditGst = () => {
    setEditingGst(false);
    dispatch(clearGstActionError());
  };

  const handleSaveGst = async () => {
    try {
      await dispatch(updateGymGstDetails(gstInput.trim().toUpperCase())).unwrap();
      setEditingGst(false);
    } catch {
      // gstActionError is already set by the rejected case — the form
      // stays open so the owner can fix and retry.
    }
  };

  const handleLogout = () => {
    dispatch(performLogout());
    navigate("/");
  };
  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("gymLogo", file);

    try {
      await dispatch(uploadGymLogo(formData)).unwrap();
    } catch (err) {
      // uploadError banner (below) already shows this — no need for
      // a blocking alert() as well.
    }

    e.target.value = "";
  };
  const handleRemoveLogo = async () => {
    try {
      await dispatch(removeGymLogo()).unwrap();
    } catch (error) {
      // uploadError banner (below) already shows this.
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error && (!gym || !owner)) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <p className="text-red-500 font-medium">{error}</p>
      </div>
    );
  }

  if (!gym || !owner) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <p className="text-gray-500">Gym profile data could not be found.</p>
      </div>
    );
  }

  const logo = gym?.gymLogo || "";
  const subscription = currentSubscription || {};

  return (
    <div className="min-h-screen bg-slate-950 p-4 pb-20 text-slate-100 md:p-8">
      <div className="max-w-xl mx-auto">
        {/* ===================== UPLOAD ERROR BANNER ===================== */}
        {uploadError && (
          <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-rose-900/60 bg-rose-950/40 p-3">
            <p className="text-sm font-medium text-rose-300">{uploadError}</p>
            <button
              onClick={() => dispatch(clearUploadError())}
              className="text-red-400 hover:text-red-600 text-xs font-bold shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ===================== LOGO ===================== */}

        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-xl">
              {logo ? (
                <img
                  src={logo}
                  alt={gym.gymName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 className="h-12 w-12 text-cyan-400" />
              )}
            </div>

            <button
              disabled={uploading}
              onClick={() => photoInputRef.current?.click()}
              className="absolute bottom-0 right-0 rounded-full bg-cyan-500 p-2 text-slate-950 shadow-lg hover:bg-cyan-400"
            >
              {uploading ? "Uploading ..." : <Camera size={16} />}
            </button>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />
          </div>

          {logo && (
            <button
              disabled={uploading}
              onClick={handleRemoveLogo}
              className="mt-2 flex items-center gap-1 text-red-500 text-sm"
            >
              {uploading ? (
                <>Removing...</>
              ) : (
                <>
                  <Trash2 size={14} />
                  Remove Logo
                </>
              )}
            </button>
          )}

          <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">Owner profile</p>
          <h1 className="mt-1 text-2xl font-bold text-white">{gym.gymName}</h1>

          <p className="mt-1 flex items-center gap-1 text-sm text-slate-400">
            <Building2 size={14} />
            {gym.gymCode}
          </p>
        </div>
        {/* ===================== OWNER DETAILS ===================== */}

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
          <h2 className="mb-5 text-sm font-bold uppercase text-slate-500">
            Owner Details
          </h2>

          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <User size={18} className="text-blue-600" />
              <div>
                <p className="text-xs text-slate-500">Owner Name</p>
                <p className="font-semibold text-slate-100">{owner.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone size={18} className="text-blue-600" />
              <div>
                <p className="text-xs text-slate-500">Mobile Number</p>
                <p className="font-semibold text-slate-100">{owner.mobile}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail size={18} className="text-blue-600" />
              <div>
                <p className="text-xs text-slate-500">Email Address</p>
                <p className="break-all font-semibold text-slate-100">{owner.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ===================== GYM DETAILS ===================== */}

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
          <h2 className="mb-5 text-sm font-bold uppercase text-slate-500">
            Gym Details
          </h2>

          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-blue-600" />
              <div>
                <p className="text-xs text-gray-400">Location</p>
                <p className="font-semibold">{gym.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Building2 size={18} className="text-blue-600" />
              <div>
                <p className="text-xs text-gray-400">Gym Code</p>
                <p className="font-semibold">{gym.gymCode}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <BadgeCheck size={18} className="text-green-600" />
              <div>
                <p className="text-xs text-gray-400">Gym Status</p>

                <span
                  className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                    gym.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {gym.status}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText size={18} className="mt-0.5 shrink-0 text-blue-600" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-400">GST Number (GSTIN)</p>

                {!editingGst ? (
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p className="truncate font-semibold">
                      {gym.gstNumber || (
                        <span className="font-normal text-slate-500">
                          Not added — invoices are non-GST
                        </span>
                      )}
                    </p>

                    <button
                      onClick={handleStartEditGst}
                      className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                      title={gym.gstNumber ? "Edit GST number" : "Add GST number"}
                    >
                      <Pencil size={15} />
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 space-y-2">
                    <input
                      type="text"
                      value={gstInput}
                      onChange={(e) => setGstInput(e.target.value.toUpperCase())}
                      placeholder="e.g. 27ABCDE1234F1Z5"
                      maxLength={15}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-sm uppercase tracking-wide text-slate-200 outline-none focus:border-cyan-400"
                    />

                    {gstActionError && (
                      <p className="text-xs text-red-400">{gstActionError}</p>
                    )}

                    <p className="text-[11px] text-slate-500">
                      Leave blank and save to remove GST — receipts will go back to the non-GST format.
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveGst}
                        disabled={gstActionLoading}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
                      >
                        <Check size={14} />
                        {gstActionLoading ? "Saving..." : "Save"}
                      </button>

                      <button
                        onClick={handleCancelEditGst}
                        disabled={gstActionLoading}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700"
                      >
                        <X size={14} />
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* ===================== TRAINERS ===================== */}
        <TrainersSection />

        {/* ===================== SUBSCRIPTION DETAILS ===================== */}

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
          <h2 className="mb-5 text-sm font-bold uppercase text-slate-500">
            Subscription Details
          </h2>

          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <BadgeCheck size={18} className="text-emerald-400" />
              <div>
                <p className="text-xs text-slate-500">Current Plan</p>
                <p className="font-semibold text-slate-100">
                  {subscription.subscriptionPlan || "No Active Plan"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CalendarDays size={18} className="text-cyan-400" />
              <div>
                <p className="text-xs text-slate-500">Start Date</p>
                <p className="font-semibold text-slate-100">
                  {subscription.startDate
                    ? new Date(subscription.startDate).toLocaleDateString()
                    : "--"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CalendarDays size={18} className="text-rose-400" />
              <div>
                <p className="text-xs text-slate-500">Expiry Date</p>
                <p className="font-semibold text-slate-100">
                  {subscription.endDate
                    ? new Date(subscription.endDate).toLocaleDateString()
                    : "--"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ===================== LOGOUT ===================== */}

        <button
          onClick={handleLogout}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-900/60 bg-rose-950/40 py-3 font-semibold text-rose-300 transition hover:bg-rose-950/70"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
}