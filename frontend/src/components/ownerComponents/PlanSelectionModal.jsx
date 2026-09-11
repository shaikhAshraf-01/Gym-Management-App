import React, { useState } from "react";
import { X, Check, MessageCircle, Sparkles, Lock } from "lucide-react";

const ADMIN_WHATSAPP_NUMBER = "9172001155"; // same support number as SubscriptionExpiredOverlay

const PLANS = [
  {
    id: "Basic",
    label: "Basic",
    tagline: "Everything you need to run the gym day-to-day",
    features: [
      "Member & membership management",
      "Manual WhatsApp confirmations (renewal, expiry)",
      "Trainer & enquiry tracking",
    ],
    prices: { 1: 249, 3: 599, 6: 999, 12: 1699 },
  },
  {
    id: "Plus",
    label: "Plus",
    tagline: "Adds automated WhatsApp so you don't send messages by hand",
    highlight: true,
    features: [
      "Connect your WhatsApp business number",
      "Auto welcome message on new member",
      "Auto reminder before expiry (you choose how many days)",
      "Auto invoice on member create / renewal",
      "Publish Offer — broadcast to your members",
    ],
    prices: { 1: 349, 3: 849, 6: 1399, 12: 2499 },
  },
  {
    id: "Pro",
    label: "Pro",
    tagline: "WhatsApp automation plus photo ID & fingerprint attendance",
    comingSoon: true,
    features: [
      "Connect your WhatsApp number",
      "Add Members profile photos",
      "Fingerprint attendance",
      "Live 'recent activity' dashboard",
    ],
  },
];

const DURATIONS = [
  { id: "1_month", label: "1 Month", short: "1 Month", months: 1 },
  { id: "3_month", label: "3 Months", short: "3 Month", months: 3 },
  { id: "6_month", label: "6 Months", short: "6 Month", months: 6 },
  { id: "1_year", label: "1 Year", short: "1 Year", months: 12 },
];

const savingsFor = (plan, months) => {
  if (months === 1 || plan.comingSoon) return 0;
  const flatRate = plan.prices[1] * months;
  const actual = plan.prices[months];
  return Math.round((1 - actual / flatRate) * 100);
};

function PlanCard({ plan, selectedPlanId, selectedMonths, onSelect }) {
  const isSelectedPlan = plan.id === selectedPlanId;

  return (
    <div
      className={`rounded-xl border p-4 transition-all relative ${
        plan.comingSoon
          ? "opacity-60 border-slate-800 bg-[#1c273e]"
          : isSelectedPlan
          ? "border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/10"
          : "border-slate-700/80 bg-[#1c273e]"
      }`}
    >
      {plan.highlight && !plan.comingSoon && (
        <span className="absolute -top-2.5 right-4 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-400 text-slate-900">
          <Sparkles className="h-3 w-3" />
          Automation
        </span>
      )}
      {plan.comingSoon && (
        <span className="absolute -top-2.5 right-4 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-slate-700 text-slate-300">
          <Lock className="h-3 w-3" />
          Coming Soon
        </span>
      )}

      <p className="text-sm font-bold text-white mb-1">{plan.label}</p>
      <p className="text-xs text-slate-400 mb-3">{plan.tagline}</p>

      <ul className="space-y-1.5 mb-4">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-1.5 text-xs text-slate-300">
            <Check className="h-3.5 w-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {/* ===== Clear per-duration pricing table ===== */}
      {plan.comingSoon ? (
        <p className="text-center text-xs text-slate-500 py-4 border-t border-slate-800">
          Pricing announced soon
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-3">
          {DURATIONS.map((d) => {
            const price = plan.prices[d.months];
            const savings = savingsFor(plan, d.months);
            const isChosen = isSelectedPlan && d.months === selectedMonths;

            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onSelect(plan.id, d.months)}
                className={`rounded-lg border px-2.5 py-2 text-left transition-all cursor-pointer ${
                  isChosen
                    ? "bg-cyan-500 border-cyan-400 text-slate-950"
                    : "bg-[#131b2e] border-slate-700 hover:border-slate-500"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`text-[10px] font-bold uppercase ${
                      isChosen ? "text-slate-800" : "text-slate-400"
                    }`}
                  >
                    {d.short}
                  </span>
                  {isChosen && <Check className="h-3 w-3 text-slate-900" />}
                </div>
                <p
                  className={`text-sm font-extrabold ${
                    isChosen ? "text-slate-950" : "text-white"
                  }`}
                >
                  ₹{price}
                </p>
                {savings > 0 && (
                  <span
                    className={`text-[9px] font-bold ${
                      isChosen ? "text-emerald-900" : "text-emerald-400"
                    }`}
                  >
                    Save {savings}%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PlanSelectionModal({ onClose, gymName }) {
  const [selectedPlanId, setSelectedPlanId] = useState("Basic");
  const [selectedMonths, setSelectedMonths] = useState(1);

  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId);
  const selectedDuration = DURATIONS.find((d) => d.months === selectedMonths);
  const totalAmount = selectedPlan.prices[selectedMonths];

  const handleSelect = (planId, months) => {
    setSelectedPlanId(planId);
    setSelectedMonths(months);
  };

  const handleContactAdmin = () => {
    const message = `Hi! I'd like to upgrade ${
      gymName ? `"${gymName}"` : "my gym"
    } to the ${selectedPlan.label} plan (${selectedDuration.label} — ₹${totalAmount}). Please help me proceed.`;

    const waLink = `https://wa.me/91${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = waLink;
    } else {
      window.open(waLink, "FitZoneWhatsAppTab");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
      <div className="bg-[#131b2e] border border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 sticky top-0 bg-[#131b2e] z-10">
          <div>
            <h2 className="text-base font-extrabold text-cyan-400 uppercase tracking-wider">
              Plans &amp; Pricing
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pick a plan and a billing period, then contact us to switch
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
          {/* Plan cards — each with its own full pricing table */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                selectedPlanId={selectedPlanId}
                selectedMonths={selectedMonths}
                onSelect={handleSelect}
              />
            ))}
          </div>

          {/* Summary + Contact Admin */}
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
              onClick={handleContactAdmin}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-3 text-sm font-bold text-slate-950 shadow transition-colors cursor-pointer"
            >
              <MessageCircle className="h-4 w-4" />
              Contact Admin to Upgrade
            </button>
            <p className="mt-2 text-center text-[11px] text-slate-500">
              We'll confirm the amount &amp; payment over WhatsApp — your plan
              updates as soon as it's received.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}