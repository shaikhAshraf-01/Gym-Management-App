import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { X, Plus, Trash2, ShieldAlert } from "lucide-react";
import { updateGym } from "../../redux/slices/gymSlice";
import { useBackHandler } from "../../hooks/useBackHandler";

// Trainer add / edit / remove for one gym. Changes are held in a draft
// and only sent when "Save Trainers" is pressed (same as the old
// drawer). Sends a partial payload — just { _id, trainers }.
export default function ManageTrainersModal({ gym, onClose }) {
  const dispatch = useDispatch();

  const [trainers, setTrainers] = useState(
    (gym.trainers || []).map((t) => ({ ...t }))
  );
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useBackHandler(!confirmRemove, onClose);
  useBackHandler(!!confirmRemove, () => setConfirmRemove(null));

  const addTrainer = () =>
    setTrainers((prev) => [
      ...prev,
      { id: `TRN-${Date.now()}`, name: "", mobile: "", email: "" },
    ]);

  const updateField = (id, field, value) =>
    setTrainers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );

  const removeTrainer = (id) =>
    setTrainers((prev) => prev.filter((t) => t.id !== id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const result = await dispatch(updateGym({ _id: gym._id, trainers }));

    setSaving(false);

    if (result?.meta?.requestStatus === "fulfilled") {
      onClose();
    } else {
      setError(result?.payload || "Failed to save trainers.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
      <div className="flex-1 cursor-pointer" onClick={onClose} />

      <div className="w-full max-w-lg bg-white h-screen shadow-2xl p-4 sm:p-6 overflow-y-auto border-l border-slate-100">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
                Trainers
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{gym.gymName}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Trainers ({trainers.length})
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

          {trainers.length === 0 && (
            <p className="text-xs text-slate-400 italic">
              No trainers added yet.
            </p>
          )}

          <div className="space-y-3">
            {trainers.map((trainer) => (
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
                      updateField(trainer.id, "name", e.target.value)
                    }
                    className="flex-1 bg-transparent text-sm font-semibold text-slate-800 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmRemove({
                        id: trainer.id,
                        label: trainer.name || trainer.mobile || "this trainer",
                      })
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
                    updateField(trainer.id, "mobile", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-500"
                />

                <input
                  type="email"
                  placeholder="Email address"
                  required
                  value={trainer.email}
                  onChange={(e) =>
                    updateField(trainer.id, "email", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            ))}
          </div>

          {error && (
            <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 sm:flex sm:justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-xl transition-colors"
            >
              {saving ? "Saving..." : "Save Trainers"}
            </button>
          </div>
        </form>
      </div>

      {confirmRemove && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <ShieldAlert className="h-5 w-5" />
              <h3 className="font-bold text-slate-800">Remove this trainer?</h3>
            </div>
            <p className="text-sm text-slate-500">
              "{confirmRemove.label}" will lose access as soon as you press
              Save Trainers. This can't be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmRemove(null)}
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  removeTrainer(confirmRemove.id);
                  setConfirmRemove(null);
                }}
                className="px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors"
              >
                Remove Trainer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}