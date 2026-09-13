import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserX, RotateCcw, Trash2 } from "lucide-react";
import {
  fetchDeletedMembers,
  restoreMember,
  permanentDeleteMember,
  PLAN_LABELS,
} from "../../redux/slices/membersSlice";

// Members that were soft-deleted from the Members list land here —
// the owner can bring them back with Restore, or clear them out for
// good with Delete Permanently (which needs a Confirm tap, since
// that one can't be undone). Its own page (not squeezed into Profile)
// so it stays usable how ever many deleted members pile up.
export default function DeletedMembers() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { deletedMembers, deletedLoading, deletedActionLoading, deletedActionError } =
    useSelector((state) => state.members);

  const [confirmingPermanentId, setConfirmingPermanentId] = useState(null);

  useEffect(() => {
    dispatch(fetchDeletedMembers());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const handleRestore = (id) => {
    dispatch(restoreMember(id));
  };

  const handlePermanentDelete = async (id) => {
    try {
      await dispatch(permanentDeleteMember(id)).unwrap();
    } finally {
      setConfirmingPermanentId(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-rose-500/10 p-2.5 text-rose-400">
          <UserX size={20} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-700 dark:text-slate-100">
            Deleted Members
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-500">
            Restore a member, or remove them for good
          </p>
        </div>
      </div>

      {deletedActionError && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/40 p-3">
          <p className="text-sm font-medium text-rose-600 dark:text-rose-300">
            {deletedActionError}
          </p>
        </div>
      )}

      {deletedLoading ? (
        <p className="py-8 text-center text-xs text-slate-500">Loading...</p>
      ) : deletedMembers.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          No deleted members — this list is clean.
        </p>
      ) : (
        <div className="space-y-2.5">
          {deletedMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3.5"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-700 dark:text-slate-100">
                  {member.name}
                </p>
                <p className="truncate text-xs text-slate-600 dark:text-slate-500">
                  {member.mobile} · {PLAN_LABELS[member.plan] || member.plan}
                </p>
              </div>

              {confirmingPermanentId === member.id ? (
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => handlePermanentDelete(member.id)}
                    disabled={deletedActionLoading}
                    className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-red-500 disabled:opacity-60"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmingPermanentId(null)}
                    className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => handleRestore(member.id)}
                    disabled={deletedActionLoading}
                    title="Restore member"
                    className="flex items-center gap-1 rounded-lg bg-green-500 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-green-600 disabled:opacity-60 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 dark:border dark:border-emerald-500/20"
                  >
                    <RotateCcw size={14} />
                    Restore
                  </button>
                  <button
                    onClick={() => setConfirmingPermanentId(member.id)}
                    title="Delete permanently"
                    className="rounded-lg bg-red-500/10 border border-red-500/20 p-2 text-red-400 hover:bg-red-500/20"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}