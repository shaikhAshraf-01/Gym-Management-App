import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  IndianRupee,
  Calendar,
  ArrowLeft,
} from "lucide-react";
import { createGymApi } from "../../api/adminApi";
// ^ Switched from ../../api/gymApi — that version didn't accept auth
//   headers at all, which would 401 if /admin/createGyms is protected.

const getAuthHeaders = () => {
  const stored = localStorage.getItem("fitzone_auth");
  if (!stored) return {};
  const { token } = JSON.parse(stored);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const PLAN_OPTIONS = ["Basic", "Plus", "Pro"];
const PAYMENT_MODES = ["Cash", "UPI", "Card"];

export default function AddGyms() {
  const navigate = useNavigate();

  // ---------------- REQUIRED FIELDS ----------------
  const [gymName, setGymName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerMobile, setOwnerMobile] = useState("");
  const [ownerEmail, setOwnerEmail] = useState(""); // now REQUIRED — it's the OTP login identifier

  // ---------------- OPTIONAL DETAILS ----------------
  const [address, setAddress] = useState("");

  // ---------------- INITIAL SUBSCRIPTION PLAN ----------------
  const [plan, setPlan] = useState("Basic");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [durationMonths, setDurationMonths] = useState(1);

  const [error, setError] = useState("");

  const handleCancel = () => navigate("/admin/all-gyms");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // ---------------- VALIDATION ----------------
    if (!gymName.trim()) {
      setError("Gym name is required.");
      return;
    }
    if (!ownerName.trim()) {
      setError("Owner name is required.");
      return;
    }
    if (!/^\d{10}$/.test(ownerMobile)) {
      setError("Enter a valid 10-digit owner mobile number.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(ownerEmail)) {
      setError("Enter a valid owner email — it's how they'll log in via OTP.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError("Enter a valid plan amount.");
      return;
    }
   
   try{
    await createGymApi(
      {
        gymName,
        ownerName,
        ownerMobile,
        ownerEmail,
        location:address,
        subscriptionPlan:plan,
        durationMonths,
        amount:Number(amount),
        paymentMode,
      },
      getAuthHeaders()
    );
    navigate("/admin/all-gyms");
   }catch(err){
    setError(err.response?.data?.message||"failed to create gym");
   }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      {/* ---------------- BACK LINK ---------------- */}
      <button
        type="button"
        onClick={handleCancel}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to All Gyms
      </button>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
          Add New Gym
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Create the gym and its owner's account. The owner logs in via email + OTP — no password to set.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-6"
      >
        {/* ---------------- GYM IDENTITY ---------------- */}
        <div className="space-y-3">
          <h2 className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Building2 className="h-3.5 w-3.5" />
            Gym Identity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-500">Gym ID (auto-generated)</label>
              <input
                type="text"
                value="Auto Generated"
                disabled
                className="mt-1 w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-mono text-slate-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">
                Gym Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={gymName}
                onChange={(e) => setGymName(e.target.value)}
                placeholder="e.g. Iron Paradise Fitness"
                className="mt-1 w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* ---------------- OWNER DETAILS ---------------- */}
        <div className="space-y-3">
          <h2 className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <User className="h-3.5 w-3.5" />
            Owner Details
          </h2>

          <div>
            <label className="text-[11px] text-slate-500">
              Owner Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="mt-1 w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-500">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="flex mt-1">
                <span className="flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-sm text-slate-500">
                  <Phone className="h-3.5 w-3.5" />
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={ownerMobile}
                  onChange={(e) => setOwnerMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="98765 43210"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-r-xl text-sm font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              {/* Email is now REQUIRED, not optional — it's how the
                  owner actually logs in (email + OTP), not just a
                  contact detail. */}
              <label className="text-[11px] text-slate-500">
                Email <span className="text-rose-500">*</span>
              </label>
              <div className="flex mt-1">
                <span className="flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-sm text-slate-500">
                  <Mail className="h-3.5 w-3.5" />
                </span>
                <input
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="owner@gym.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-r-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
            The owner will log in using this email — they'll receive a one-time code by email each time, no password needed.
          </p>
        </div>

        {/* ---------------- LOCATION ---------------- */}
        <div className="space-y-2">
          <h2 className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <MapPin className="h-3.5 w-3.5" />
            Address (optional)
          </h2>
          <textarea
            rows="2"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Shop / plot, area, city, state"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* ---------------- INITIAL SUBSCRIPTION PLAN ---------------- */}
        <div className="space-y-3">
          <h2 className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <IndianRupee className="h-3.5 w-3.5" />
            Initial Subscription Plan
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="col-span-1">
              <label className="text-[11px] text-slate-500">Plan</label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              >
                {PLAN_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-1">
              <label className="text-[11px] text-slate-500">Duration</label>
              <select
                value={durationMonths}
                onChange={(e) => setDurationMonths(Number(e.target.value))}
                className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              >
                {[1, 3, 6, 12].map((m) => (
                  <option key={m} value={m}>
                    {m} {m === 1 ? "month" : "months"}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-1">
              <label className="text-[11px] text-slate-500">
                Amount <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="15000"
                className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="col-span-1">
              <label className="text-[11px] text-slate-500">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              >
                {PAYMENT_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Plan starts today and runs for the selected duration.
          </p>
        </div>

        {/* ---------------- ERROR ---------------- */}
        {error && (
          <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* ---------------- ACTIONS ---------------- */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleCancel}
            className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer"
          >
            Create Gym
          </button>
        </div>
      </form>
    </div>
  );
}