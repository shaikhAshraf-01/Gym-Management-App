import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  IndianRupee,
  Calendar,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";
import { addGym } from "../../redux/slices/gymSlice";


// ^ Adjust this import path to wherever gymsSlice.js actually lives
//   in your folder structure (e.g. "../../../features/superAdmin/gymsSlice").

// ------------------------------------------------------------------
// AddGym — Super Admin form to onboard a brand new gym.
//
// What this creates:
//  1. The gym record itself (name, address, status)
//  2. The OWNER's login account (mobile + a TEMPORARY password set by
//     the admin — owner is forced to change it on first login via the
//     `mustChangePassword` flag)
//  3. One initial subscriptionHistory entry, so the gym isn't sitting
//     with zero plans the moment it's created (AllGyms.jsx already
//     assumes every gym has at least one subscription entry).
//
// Trainers are NOT added here — that already happens inside the Edit
// drawer in AllGyms.jsx once the gym exists.
//
// Wired to Redux: dispatches `addGym` on success and navigates back
// to the gym list — no more onAddGym/onCancel props, this component
// is self-contained now that gymsSlice + react-router are both set up.
// ------------------------------------------------------------------

const PLAN_OPTIONS = ["Basic", "Plus", "Pro"];
const PAYMENT_MODES = ["Cash", "UPI", "Card"];

// Finds the next Gym ID from the CURRENT list in Redux — see
// gymsSlice.js's own generateGymId note for why this is deterministic
// (max + 1) rather than random, and why it'll eventually need to move
// server-side once multiple admins can create gyms concurrently.
function generateGymId(existingIds) {
  const numbers = existingIds
    .map((id) => parseInt(id.replace("GYM-", ""), 10))
    .filter((n) => !isNaN(n));

  const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 101;
  return `GYM-${nextNumber}`;
}

export default function AddGyms() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Read the live gym list straight from the store so the generated
  // ID is always based on what's ACTUALLY there right now.
  const existingGymIds = useSelector((state) => state.gyms.gyms.map((g) => g.id));

  // ---------------- REQUIRED FIELDS ----------------
  const [gymId] = useState(() => generateGymId(existingGymIds)); // generated once, read-only
  const [gymName, setGymName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerMobile, setOwnerMobile] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ---------------- OPTIONAL DETAILS ----------------
  const [ownerEmail, setOwnerEmail] = useState("");
  const [address, setAddress] = useState("");

  // ---------------- INITIAL SUBSCRIPTION PLAN ----------------
  const [plan, setPlan] = useState("Basic");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [durationMonths, setDurationMonths] = useState(1);

  const [error, setError] = useState("");

  const handleCancel = () => navigate("/admin/all-gyms");

  const handleSubmit = (e) => {
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
    // Extra safety check on top of the deterministic generator — if
    // two admins somehow created gyms at nearly the same moment
    // before this page's data refreshed, don't silently overwrite.
    if (existingGymIds.includes(gymId)) {
      setError("Gym ID collision — refresh and try again.");
      return;
    }
    if (tempPassword.length < 6) {
      setError("Temporary password must be at least 6 characters.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError("Enter a valid plan amount.");
      return;
    }

    // ---------------- BUILD THE SUBSCRIPTION ENTRY ----------------
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + Number(durationMonths));

    const newGym = {
      id: gymId,
      name: gymName.trim(),
      ownerName: ownerName.trim(),
      ownerMobile,
      // Temporary password, set by the admin. The login flow checks
      // `mustChangePassword` and redirects the owner to a "Set new
      // password" screen before letting them into the dashboard.
      ownerPassword: tempPassword,
      mustChangePassword: true,
      email: ownerEmail.trim(),
      status: "active",
      totalMembers: 0,
      enquiries: 0,
      address: address.trim(),
      trainers: [], // added later, from the Edit drawer
      subscriptionHistory: [
        {
          id: `SUB-${Date.now()}`,
          plan,
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
          amount: Number(amount),
          paymentMode,
        },
      ],
    };

    dispatch(addGym(newGym));
    navigate("/admin/all-gyms"); // back to the list, where the new card now appears
  };

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
          Create the gym's account and set a temporary password for the owner.
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
                value={gymId}
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
              <label className="text-[11px] text-slate-500">Email (optional)</label>
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
        </div>

        {/* ---------------- TEMPORARY PASSWORD ---------------- */}
        <div className="space-y-2">
          <h2 className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Lock className="h-3.5 w-3.5" />
            Temporary Password
          </h2>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
              placeholder="Set a temporary password"
              className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 flex items-start gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            The owner will be required to change this password the first time
            they log in — enforced via <code>mustChangePassword</code>, which
            your login flow checks and redirects on.
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