import React, { useState } from "react";
import { X, Check, Zap, MessageCircle, Sparkles, Loader2 } from "lucide-react";

// ---------------------------------------------------------------------
// Plan catalogue — kept in sync with backend GymSubscriptionHistory
// (subscriptionPlan enum: "Basic" | "Plus" | "Pro") and pricing.
// ---------------------------------------------------------------------
const PLANS = [
  {
    id: "Basic",
    label: "Basic",
    monthlyPrice: 200,
    tagline: "Everything you need to run the gym day-to-day",
    features: [
      "Member & membership management",
      "Manual WhatsApp confirmations (renewal, expiry)",
      "Trainer & enquiry tracking",
    ],
  },
  {
    id: "Plus",
    label: "Plus",
    monthlyPrice: 300,
    tagline: "Adds automated WhatsApp so you don't send messages by hand",
    highlight: true,
    features: [
      "Everything in Basic",
      "Auto welcome message on new member",
      "Auto reminder 3 days before expiry",
      "Auto confirmation on extend/renew",
      "Publish Offer — broadcast to your members",
    ],
  },
];

const DURATIONS = [
  { id: "1_month", label: "1 Month", months: 1 },
  { id: "3_month", label: "3 Months", months: 3 },
  { id: "6_month", label: "6 Months", months: 6 },
  { id: "1_year", label: "1 Year", months: 12 },
];

export default function PlanSelectionModal({ onClose, onProceedToPay }) {
  const [selectedPlanId, setSelectedPlanId] = useState("Basic");
  const [selectedDurationId, setSelectedDurationId] = useState("1_month");
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId);
  const selectedDuration = DURATIONS.find((d) => d.id === selectedDurationId);
  const totalAmount = selectedPlan.monthlyPrice * selectedDuration.months;

  const handleProceed = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      if (onProceedToPay) {
        await onProceedToPay({
          plan: selectedPlanId,
          duration: selectedDurationId,
          durationMonths: selectedDuration.months,
          amount: totalAmount,
        });
      } else {
        // Placeholder until the payment gateway is wired up.
        alert(
          `Payment gateway coming soon.\n\nPlan: ${selectedPlan.label}\nDuration: ${selectedDuration.label}\nAmount: ₹${totalAmount}`
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
      <div className="bg-[#131b2e] border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 sticky top-0 bg-[#131b2e] z-10">
          <div>
            <h2 className="text-base font-extrabold text-cyan-400 uppercase tracking-wider">
              Select Plan
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Renew your gym's subscription to continue
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 rounded-lg cursor-pointer transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 md:p-6 space-y-5">
          {/* Plan cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PLANS.map((plan) => {
              const isSelected = plan.id === selectedPlanId;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`text-left rounded-xl border p-4 transition-all cursor-pointer relative ${
                    isSelected
                      ? "border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/10"
                      : "border-slate-700/80 bg-[#1c273e] hover:border-slate-600"
                  }`}
                >
                  {plan.highlight && (
                    <span className="absolute -top-2.5 right-4 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-400 text-slate-900">
                      <Sparkles className="h-3 w-3" />
                      Automation
                    </span>
                  )}

                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-white">
                      {plan.label}
                    </span>
                    {isSelected && (
                      <span className="h-5 w-5 rounded-full bg-cyan-400 flex items-center justify-center">
                        <Check className="h-3.5 w-3.5 text-slate-950" />
                      </span>
                    )}
                  </div>

                  <p className="text-xl font-extrabold text-white mb-1">
                    ₹{plan.monthlyPrice}
                    <span className="text-xs font-medium text-slate-400">
                      {" "}
                      /month
                    </span>
                  </p>

                  <p className="text-xs text-slate-400 mb-3">{plan.tagline}</p>

                  <ul className="space-y-1.5">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-1.5 text-xs text-slate-300"
                      >
                        <Check className="h-3.5 w-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs uppercase font-bold text-slate-400 mb-1.5">
              Duration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {DURATIONS.map((d) => {
                const isSelected = d.id === selectedDurationId;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedDurationId(d.id)}
                    className={`py-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-cyan-500 border-cyan-400 text-slate-950"
                        : "bg-[#1c273e] border-slate-700 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Summary + Pay */}
          <div className="rounded-xl border border-slate-800 bg-[#1c273e] p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-slate-400">
                  {selectedPlan.label} · {selectedDuration.label}
                </p>
                <p className="text-lg font-extrabold text-white">
                  ₹{totalAmount}
                </p>
              </div>

              {selectedPlan.id === "Plus" && (
                <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold">
                  <MessageCircle className="h-4 w-4" />
                  Automated WhatsApp
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleProceed}
              disabled={isProcessing}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 px-4 py-3 text-sm font-bold text-slate-950 shadow transition-colors cursor-pointer"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Proceed to Pay ₹{totalAmount}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}