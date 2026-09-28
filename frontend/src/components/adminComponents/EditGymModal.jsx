import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { X, Trash2 } from "lucide-react";
import { updateGym } from "../../redux/slices/gymSlice";
import { useBackHandler } from "../../hooks/useBackHandler";

// Edits ONLY the gym's own details (status, address, owner info).
// Subscription changes live in RenewGymModal, trainers in
// ManageTrainersModal. Sends a partial payload — the backend's
// updateGym skips any field that isn't in the request body.
export default function EditGymModal({ gym, onClose, onRequestDelete }) {
  const dispatch = useDispatch();

  const [status, setStatus] = useState(gym.status);
  const [address, setAddress] = useState(gym.address || "");
  const [owner, setOwner] = useState({
    name: gym.owner?.name || "",
    mobile: gym.owner?.mobile || "",
    email: gym.owner?.email || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useBackHandler(true, onClose);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const result = await dispatch(
      updateGym({ _id: gym._id, status, address, owner })
    );

    setSaving(false);

    if (result?.meta?.requestStatus === "fulfilled") {
      onClose();
    } else {
      setError(result?.payload || "Failed to save changes.");
    }
  };

  const inputClass =
    "mt-1 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
      <div className="flex-1 cursor-pointer" onClick={onClose} />

      <div className="w-full max-w-lg bg-white h-screen shadow-2xl p-4 sm:p-6 overflow-y-auto border-l border-slate-100">
        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          {/* HEADER */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
                Edit {gym.gymName}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Gym status, address and owner details
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
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
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={inputClass}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* ADDRESS */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Address Location
            </label>
            <textarea
              rows="2"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* OWNER DETAILS */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Owner Details
            </label>

            <div>
              <span className="text-[11px] text-slate-500">Owner Name</span>
              <input
                type="text"
                required
                value={owner.name}
                onChange={(e) => setOwner({ ...owner, name: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <span className="text-[11px] text-slate-500">
                Owner Mobile Number
              </span>
              <input
                type="text"
                required
                value={owner.mobile}
                onChange={(e) => setOwner({ ...owner, mobile: e.target.value })}
                className={`${inputClass} font-mono`}
              />
            </div>

            <div>
              <span className="text-[11px] text-slate-500">Owner Email</span>
              <input
                type="email"
                required
                value={owner.email}
                onChange={(e) => setOwner({ ...owner, email: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* FOOTER */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onRequestDelete(gym)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              Delete Gym
            </button>

            <div className="grid grid-cols-2 sm:flex sm:items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-xl transition-colors cursor-pointer"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}