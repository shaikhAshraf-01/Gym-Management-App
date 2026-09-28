import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { X, RefreshCw, Edit3 } from "lucide-react";
import { updateGym } from "../../redux/slices/gymSlice";
import { getPlanPricingApi } from "../../api/adminApi";
import { useBackHandler } from "../../hooks/useBackHandler";
import WhatsAppRenewMessagePopup from "./WhatsAppRenewMessagePopup";

// Used only until the live admin-published pricing loads (or if that
// fetch fails). Mirrors the seed defaults in backend/utils/planPricingDefaults.js.
const FALLBACK_PRICES = {
  Basic: { 1: 249, 3: 599, 6: 999, 12: 1699 },
  Plus: { 1: 349, 3: 849, 6: 1399, 12: 2499 },
  Pro: null,
};

const formatDateInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Today if the current plan already expired, otherwise the day after
// it expires (so a renewal never overlaps the running plan).
const calculateDefaultStartDate = (gym) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let start = new Date(today);
  const currentEnd = gym?.currentSubscription?.endDate;

  if (currentEnd) {
    const expiry = new Date(currentEnd);
    expiry.setHours(0, 0, 0, 0);
    if (expiry >= today) {
      start = new Date(expiry);
      start.setDate(start.getDate() + 1);
    }
  }
  return formatDateInput(start);
};

// Two modes, kept deliberately separate so editing the current plan can
// never be mistaken for a renewal:
//   "renew"   -> adds a NEW subscription-history entry + WhatsApp popup
//   "current" -> fixes the CURRENT subscription in place (no new entry,
//                no WhatsApp popup)
export default function RenewGymModal({ gym, onClose }) {
  const dispatch = useDispatch();
  const current = gym.currentSubscription;

  const [mode, setMode] = useState("renew");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [whatsApp, setWhatsApp] = useState(null);
  const [prices, setPrices] = useState(FALLBACK_PRICES);

  // ---- renew form ----
  const [renewPlan, setRenewPlan] = useState(current?.subscriptionPlan || "Basic");
  const [renewMonths, setRenewMonths] = useState(current?.durationMonths || 1);
  const [renewStart, setRenewStart] = useState(calculateDefaultStartDate(gym));
  const [renewEnd, setRenewEnd] = useState("");
  const [renewAmount, setRenewAmount] = useState(current?.amount || "");
  const [renewPayment, setRenewPayment] = useState(current?.paymentMode || "UPI");

  // ---- current plan form ----
  const [fixPlan, setFixPlan] = useState(current?.subscriptionPlan || "Basic");
  const [fixStart, setFixStart] = useState(current?.startDate || "");
  const [fixEnd, setFixEnd] = useState(current?.endDate || "");

  // Back button closes the form; while the WhatsApp popup is showing,
  // it closes the popup (and this modal with it).
  useBackHandler(!whatsApp, onClose);
  useBackHandler(!!whatsApp, onClose);

  // Auto-calc end date from start + duration (still editable after).
  useEffect(() => {
    if (!renewStart) return;
    const end = new Date(`${renewStart}T12:00:00`);
    end.setMonth(end.getMonth() + Number(renewMonths));
    setRenewEnd(formatDateInput(end));
  }, [renewMonths, renewStart]);

  // List-price suggestion comes from what admin has published.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getPlanPricingApi();
        const data = res?.data?.data;
        if (cancelled || !data) return;
        const toMap = (t) =>
          t ? { 1: t.price1, 3: t.price3, 6: t.price6, 12: t.price12 } : null;
        setPrices({
          Basic: toMap(data.Basic),
          Plus: toMap(data.Plus),
          Pro: data.Pro?.price1 > 0 ? toMap(data.Pro) : null,
        });
      } catch {
        // keep fallback prices
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRenew = async (e) => {
    e.preventDefault();
    setError("");

    if (!renewStart || !renewEnd || !renewAmount) {
      setError("Start date, end date and amount are required.");
      return;
    }

    setSaving(true);
    const result = await dispatch(
      updateGym({
        _id: gym._id,
        status: "active",
        // No _id on purpose — that's what tells the backend this is
        // a NEW subscription (added to history) and not a correction.
        currentSubscription: {
          subscriptionPlan: renewPlan,
          durationMonths: Number(renewMonths),
          startDate: renewStart,
          endDate: renewEnd,
          amount: Number(renewAmount),
          paymentMode: renewPayment,
        },
      })
    );
    setSaving(false);

    if (result?.meta?.requestStatus === "fulfilled") {
      setWhatsApp({
        phone: gym.owner?.mobile,
        gymName: gym.gymName,
        plan: renewPlan,
        months: renewMonths,
        amount: renewAmount,
        newEndDate: renewEnd,
      });
    } else {
      setError(result?.payload || "Failed to renew subscription.");
    }
  };

  const handleCorrect = async (e) => {
    e.preventDefault();
    setError("");

    setSaving(true);
    const result = await dispatch(
      updateGym({
        _id: gym._id,
        currentSubscription: {
          ...current, // keeps _id -> backend updates this exact entry
          subscriptionPlan: fixPlan,
          startDate: fixStart,
          endDate: fixEnd,
        },
      })
    );
    setSaving(false);

    if (result?.meta?.requestStatus === "fulfilled") {
      onClose();
    } else {
      setError(result?.payload || "Failed to save changes.");
    }
  };

  const suggested = prices[renewPlan]?.[renewMonths];

  const fieldLabel = "block text-[10px] uppercase font-bold text-slate-500 mb-1";
  const renewInput =
    "w-full bg-white border border-indigo-200 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500";
  const fixInput =
    "w-full bg-white border border-slate-200 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500";

  if (whatsApp) {
    return (
      <WhatsAppRenewMessagePopup
        isOpen
        onClose={onClose}
        phone={whatsApp.phone}
        gymName={whatsApp.gymName}
        plan={whatsApp.plan}
        months={whatsApp.months}
        amount={whatsApp.amount}
        newEndDate={whatsApp.newEndDate}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
      <div className="flex-1 cursor-pointer" onClick={onClose} />

      <div className="w-full max-w-lg bg-white h-screen shadow-2xl p-4 sm:p-6 overflow-y-auto border-l border-slate-100 space-y-5">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
              {gym.gymName}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Current plan:{" "}
              <span className="font-semibold text-slate-600">
                {current?.subscriptionPlan}
              </span>
              {" · "}ends{" "}
              <span className="font-semibold text-slate-600">
                {current?.endDate}
              </span>
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

        {/* MODE SWITCH */}
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
          {[
            { id: "renew", label: "Renew / Change Plan" },
            { id: "current", label: "Current Plan" },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setMode(m.id);
                setError("");
              }}
              className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === m.id
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === "renew" ? (
          <form
            onSubmit={handleRenew}
            className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 space-y-3"
          >
            <label className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 uppercase tracking-wider">
              <RefreshCw className="h-3.5 w-3.5" />
              New subscription
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className={fieldLabel}>Plan</label>
                <select
                  value={renewPlan}
                  onChange={(e) => setRenewPlan(e.target.value)}
                  className={renewInput}
                >
                  <option value="Basic">Basic</option>
                  <option value="Plus">Plus</option>
                  <option value="Pro">Pro</option>
                </select>
              </div>

              <div>
                <label className={fieldLabel}>Duration</label>
                <select
                  value={renewMonths}
                  onChange={(e) => setRenewMonths(Number(e.target.value))}
                  className={renewInput}
                >
                  <option value={1}>1 Month</option>
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={12}>1 Year</option>
                </select>
              </div>

              <div>
                <label className={fieldLabel}>Start Date</label>
                <input
                  type="date"
                  value={renewStart}
                  onChange={(e) => setRenewStart(e.target.value)}
                  className={`${renewInput} text-indigo-700 font-semibold`}
                />
              </div>

              <div>
                <label className={fieldLabel}>End Date</label>
                <input
                  type="date"
                  value={renewEnd}
                  onChange={(e) => setRenewEnd(e.target.value)}
                  className={`${renewInput} text-indigo-700 font-semibold`}
                />
              </div>

              <div>
                <label className={fieldLabel}>Amount</label>
                <input
                  type="number"
                  min="0"
                  value={renewAmount}
                  onChange={(e) => setRenewAmount(e.target.value)}
                  placeholder="₹ amount"
                  className={renewInput}
                />
                {suggested ? (
                  <button
                    type="button"
                    onClick={() => setRenewAmount(String(suggested))}
                    className="mt-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    List price: ₹{suggested} · tap to use
                  </button>
                ) : null}
              </div>

              <div>
                <label className={fieldLabel}>Payment Mode</label>
                <select
                  value={renewPayment}
                  onChange={(e) => setRenewPayment(e.target.value)}
                  className={renewInput}
                >
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                </select>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Adds a new entry to the timeline and activates the gym. A
              WhatsApp message to the owner opens after it's saved.
            </p>

            {error && (
              <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {saving ? "Saving..." : "Renew Subscription"}
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleCorrect}
            className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3"
          >
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Edit3 className="h-3.5 w-3.5" />
              Current subscription
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className={fieldLabel}>Plan</label>
                <select
                  value={fixPlan}
                  onChange={(e) => setFixPlan(e.target.value)}
                  className={fixInput}
                >
                  <option value="Basic">Basic</option>
                  <option value="Plus">Plus</option>
                  <option value="Pro">Pro</option>
                </select>
              </div>

              <div />

              <div>
                <label className={fieldLabel}>Start Date</label>
                <input
                  type="date"
                  value={fixStart}
                  onChange={(e) => setFixStart(e.target.value)}
                  className={`${fixInput} font-semibold`}
                />
              </div>

              <div>
                <label className={fieldLabel}>End Date</label>
                <input
                  type="date"
                  value={fixEnd}
                  onChange={(e) => setFixEnd(e.target.value)}
                  className={`${fixInput} font-semibold`}
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Fixes a mistake in the running plan only. It doesn't add a new
              timeline entry and doesn't send a WhatsApp message.
            </p>

            {error && (
              <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-slate-700 rounded-lg hover:bg-slate-800 disabled:opacity-60 transition-colors"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}