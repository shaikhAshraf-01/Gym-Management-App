import React, { useState } from "react";
import { AlertTriangle, Phone, ClipboardList } from "lucide-react";
import PlanSelectionModal from "./PlanSelectionModal";

export default function SubscriptionExpiredOverlay({ gymName, onReturn }) {
  const [showPlanModal, setShowPlanModal] = useState(false);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-white/40 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 p-8 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-7 w-7 text-red-600" />
        </div>

        <h2 className="text-lg font-bold text-slate-800 mb-2">
          Subscription Expired
        </h2>

        <p className="text-sm leading-6 text-slate-600 mb-6">
          Dear {gymName || "Gym"}, your subscription has expired. Select a
          plan below to renew and continue using your account.
        </p>

        {/* Primary action: renew via plan selection */}
        <button
          onClick={() => setShowPlanModal(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
        >
          <ClipboardList className="h-4 w-4" />
          Select Plan
        </button>

        {/* Fallback: contact support if payment doesn't go through */}
        <p className="text-xs text-slate-400 mt-4">
          Payment issue? Contact support at{" "}
          <a
            href="tel:9172001155"
            className="inline-flex items-center gap-1 font-semibold text-green-600 hover:underline"
          >
            <Phone className="h-3 w-3" />
            9172001155
          </a>
        </p>
      </div>

      {showPlanModal && (
        <PlanSelectionModal onClose={() => setShowPlanModal(false)} />
      )}
    </div>
  );
}