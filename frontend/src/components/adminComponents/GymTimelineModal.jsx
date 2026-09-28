import React from "react";
import {
  X,
  Clock,
  Calendar,
  IndianRupee,
  CheckCircle2,
} from "lucide-react";
import { useBackHandler } from "../../hooks/useBackHandler";

const isActivePeriod = (sub) => {
  const today = new Date();
  return today >= new Date(sub.startDate) && today <= new Date(sub.endDate);
};

// The timeline itself (summary tiles + entries). Used inside the modal
// and, inline, in the Timeline tab of the Gym View page.
export function GymTimelineContent({ gym }) {
  const history = gym.subscriptionHistory || [];
  const lifetimeRevenue = history.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-xl border border-slate-100 p-3">
          <span className="text-[11px] text-slate-400">Lifetime Revenue</span>
          <p className="text-base font-bold text-slate-800 mt-0.5 flex items-center">
            <IndianRupee className="h-3.5 w-3.5" />
            {lifetimeRevenue.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl border border-slate-100 p-3">
          <span className="text-[11px] text-slate-400">
            Total Plans Purchased
          </span>
          <p className="text-base font-bold text-slate-800 mt-0.5">
            {history.length}
          </p>
        </div>
      </div>

      <ol className="relative border-l-2 border-slate-100 ml-2">
        {[...history].reverse().map((sub) => {
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
  );
}

// Read-only subscription history for one gym, as a popup.
export default function GymTimelineModal({ gym, onClose }) {
  useBackHandler(true, onClose);

  const clientSince = gym.subscriptionHistory?.[0]?.startDate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-3 sm:px-4 py-6 sm:py-8">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">
              {gym.gymName}
            </h2>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <Clock className="h-3 w-3" />
              Client since {clientSince}
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

        <GymTimelineContent gym={gym} />
      </div>
    </div>
  );
}