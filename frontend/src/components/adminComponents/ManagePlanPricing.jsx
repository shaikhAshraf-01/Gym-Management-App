import React, { useEffect, useState } from "react";
import { IndianRupee, Tag, CheckCircle2, AlertCircle } from "lucide-react";
import { getPlanPricingApi, updatePlanPricingApi } from "../../api/adminApi.js";

const TIERS = ["Basic", "Plus", "Pro"];
const DURATIONS = [
  { key: "price1", label: "1 Month" },
  { key: "price3", label: "3 Months" },
  { key: "price6", label: "6 Months" },
  { key: "price12", label: "12 Months" },
];

const EMPTY_TIER = {
  price1: "",
  price3: "",
  price6: "",
  price12: "",
  badgeText: "",
  badgeActive: false,
};

export default function ManagePlanPricing() {
  const [form, setForm] = useState({
    Basic: { ...EMPTY_TIER },
    Plus: { ...EMPTY_TIER },
    Pro: { ...EMPTY_TIER },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await getPlanPricingApi();
        const data = res?.data?.data;
        if (!cancelled && data) {
          setForm({
            Basic: { ...EMPTY_TIER, ...data.Basic },
            Plus: { ...EMPTY_TIER, ...data.Plus },
            Pro: { ...EMPTY_TIER, ...data.Pro },
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message || "Failed to load current pricing."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleFieldChange = (tier, field, value) => {
    setForm((prev) => ({
      ...prev,
      [tier]: { ...prev[tier], [field]: value },
    }));
    // Editing again after a save clears the old success/error banner
    if (success) setSuccess("");
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Basic client-side check before hitting the server — every
    // duration field across all 3 tiers must be a non-negative number.
    for (const tier of TIERS) {
      for (const { key } of DURATIONS) {
        const value = Number(form[tier][key]);
        if (form[tier][key] === "" || !Number.isFinite(value) || value < 0) {
          setError(`${tier} — please enter a valid price for every duration.`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      const payload = {};
      for (const tier of TIERS) {
        payload[tier] = {
          price1: Number(form[tier].price1),
          price3: Number(form[tier].price3),
          price6: Number(form[tier].price6),
          price12: Number(form[tier].price12),
          badgeText: form[tier].badgeText,
          badgeActive: !!form[tier].badgeActive,
        };
      }

      const res = await updatePlanPricingApi(payload);
      setSuccess(res?.data?.message || "Plan pricing published successfully.");
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to publish plan pricing."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center text-sm text-slate-400">
        Loading current pricing...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <IndianRupee className="h-5 w-5 text-indigo-500" />
          Manage Plan Pricing
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Set what gym owners pay to subscribe to Basic, Plus and Pro. This
          is your subscription pricing — not a gym's own member fees.
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {TIERS.map((tier) => (
          <div
            key={tier}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
          >
            <h2 className="text-base font-bold text-slate-800 mb-4">
              {tier}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {DURATIONS.map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    {label}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={form[tier][key]}
                      onChange={(e) =>
                        handleFieldChange(tier, key, e.target.value)
                      }
                      className="w-full pl-6 pr-2 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Promo badge (optional)
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    maxLength={60}
                    value={form[tier].badgeText}
                    onChange={(e) =>
                      handleFieldChange(tier, "badgeText", e.target.value)
                    }
                    placeholder="e.g. Diwali Offer — Save 15%"
                    className="w-full pl-8 pr-2 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-slate-600 select-none pt-1 sm:pt-5 shrink-0">
                <input
                  type="checkbox"
                  checked={form[tier].badgeActive}
                  onChange={(e) =>
                    handleFieldChange(tier, "badgeActive", e.target.checked)
                  }
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Show badge to owners
              </label>
            </div>
          </div>
        ))}

        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-sm transition-colors"
        >
          {saving ? "Publishing..." : "Save & Publish"}
        </button>
      </form>
    </div>
  );
}