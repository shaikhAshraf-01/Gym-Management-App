import { createSlice } from "@reduxjs/toolkit";

// ------------------------------------------------------------------
// gymsSlice — Super Admin domain.
// Holds the gym list (AllGyms.jsx) and everything that hangs off each
// gym: trainers, subscription history, status. AddGym.jsx dispatches
// `addGym` on successful creation; AllGyms.jsx dispatches the rest.
//
// UI-only state (which drawer is open, which gym is selected for the
// timeline modal, password visibility toggles) stays as local
// useState in the components — it doesn't belong here.
// ------------------------------------------------------------------

const initialState = {
  gyms: [
    // Same mock data AllGyms.jsx was using locally — moved here so it
    // survives navigation and both AllGyms + AddGym read/write the
    // same source of truth. Swap this array for [] once a real
    // fetchGyms thunk exists.
    {
      id: "GYM-101",
      name: "S11 Fitness",
      ownerName: "Sajid Shaikh",
      ownerMobile: "7798334404",
      ownerPassword: "owner@123",
      mustChangePassword: false,
      email: "",
      status: "active",
      totalMembers: 0,
      enquiries: 0,
      address: "Near talab Masjid ,Kondhwa, Pune",
      trainers: [
        { id: "TRN-1", name: "Sanjay Patil", mobile: "9822055667", password: "sanjay@123", mustChangePassword: false },
        { id: "TRN-2", name: "Anita Rao", mobile: "9765433221", password: "anita@456", mustChangePassword: false },
      ],
      subscriptionHistory: [
        { id: "SUB-1", plan: "Basic", startDate: "2024-07-10", endDate: "2025-01-10", amount: 15000, paymentMode: "UPI" },
        { id: "SUB-2", plan: "Plus", startDate: "2025-01-10", endDate: "2025-07-10", amount: 22000, paymentMode: "Card" },
        { id: "SUB-3", plan: "Pro", startDate: "2025-07-10", endDate: "2026-07-10", amount: 45000, paymentMode: "Cash" },
      ],
    },
    {
      id: "GYM-102",
      name: "Gold's Gym Center",
      ownerName: "Amit Verma",
      ownerMobile: "9123456789",
      ownerPassword: "golds_owner_secure",
      mustChangePassword: false,
      email: "amit@goldsgym.in",
      status: "inactive",
      totalMembers: 198,
      enquiries: 12,
      address: "Galaxy Tower, 3rd Floor, MG Road, Mumbai, MH",
      trainers: [
        { id: "TRN-3", name: "Vikas Deshpande", mobile: "9090912345", password: "vikas@789", mustChangePassword: false },
      ],
      subscriptionHistory: [
        { id: "SUB-4", plan: "Basic", startDate: "2025-06-10", endDate: "2026-06-10", amount: 18000, paymentMode: "Cash" },
      ],
    },
  ],
  loading: false,
  error: null,
};

// ------------------------------------------------------------------
// Helper (not a reducer) — finds a gym by id inside a reducer body.
// Reducers below use Immer, so mutating the found object directly is
// safe and updates state correctly.
// ------------------------------------------------------------------
function findGym(state, gymId) {
  return state.gyms.find((g) => g.id === gymId);
}

const gymSlice = createSlice({
  name: "gyms",
  initialState,
  reducers: {
    // ---------------- LOADING STATE (for when a real API exists) ----------------
    fetchGymsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchGymsSuccess: (state, action) => {
      state.loading = false;
      state.gyms = action.payload;
    },
    fetchGymsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    // ---------------- ADD GYM ----------------
    // Called from AddGym.jsx with the fully-built gym object
    // (including its first subscriptionHistory entry).
    addGym: (state, action) => {
      state.gyms.push(action.payload);
    },

    // ---------------- UPDATE GYM (drawer "Save Configuration Changes") ----------------
    // Replaces one gym wholesale — this is what the Edit drawer's
    // handleDrawerSave dispatches, since the drawer already works on
    // a full cloned copy of the gym before saving.
    updateGym: (state, action) => {
      const index = state.gyms.findIndex((g) => g.id === action.payload.id);
      if (index !== -1) state.gyms[index] = action.payload;
    },

    // ---------------- DELETE GYM ----------------
    deleteGym: (state, action) => {
      state.gyms = state.gyms.filter((g) => g.id !== action.payload);
    },

    // ---------------- TRAINER MANAGEMENT ----------------
    // Usable by BOTH Admin (from the AllGyms drawer) and Owner (from
    // their own People/Team page) — this slice doesn't care who
    // dispatches it, role-based permission checks belong in the UI
    // layer, not here.
    addTrainer: (state, action) => {
      const { gymId, trainer } = action.payload;
      const gym = findGym(state, gymId);
      // Every new trainer gets a forced password change on first
      // login, same as a newly onboarded owner — regardless of
      // whether the caller remembered to set the flag themselves.
      if (gym) gym.trainers.push({ ...trainer, mustChangePassword: true });
    },

    updateTrainerField: (state, action) => {
      const { gymId, trainerId, field, value } = action.payload;
      const gym = findGym(state, gymId);
      if (!gym) return;
      const trainer = gym.trainers.find((t) => t.id === trainerId);
      if (trainer) trainer[field] = value;
    },

    removeTrainer: (state, action) => {
      const { gymId, trainerId } = action.payload;
      const gym = findGym(state, gymId);
      if (gym) gym.trainers = gym.trainers.filter((t) => t.id !== trainerId);
    },

    // ---------------- RENEW SUBSCRIPTION ----------------
    // Appends a new subscriptionHistory entry (not an overwrite) so
    // the Timeline modal keeps showing every past plan. Extends from
    // whichever is later — today, or the current plan's end date —
    // so renewing early doesn't throw away paid-for time still left.
    renewSubscription: (state, action) => {
      const { gymId, months } = action.payload;
      const gym = findGym(state, gymId);
      if (!gym) return;

      const current = gym.subscriptionHistory[gym.subscriptionHistory.length - 1];
      const today = new Date();
      const base = new Date(current.endDate);
      const startFrom = base > today ? base : today;

      const newStart = new Date(startFrom);
      const newEnd = new Date(startFrom);
      newEnd.setMonth(newEnd.getMonth() + months);

      gym.subscriptionHistory.push({
        id: `SUB-${Date.now()}`,
        plan: current.plan,
        startDate: newStart.toISOString().split("T")[0],
        endDate: newEnd.toISOString().split("T")[0],
        amount: current.amount,
        paymentMode: current.paymentMode,
      });
      gym.status = "active"; // renewing reactivates the gym
    },

    // ---------------- STATUS / METRICS / ADDRESS / OWNER FIELDS ----------------
    // One generic "patch a gym's top-level fields" action instead of
    // a separate reducer per field (status, totalMembers, enquiries,
    // address, ownerMobile, ownerPassword) — keeps this file shorter
    // and covers anything the Edit drawer's simple inputs need.
    // payload: { gymId, changes: { field: value, ... } }
    updateGymFields: (state, action) => {
      const { gymId, changes } = action.payload;
      const gym = findGym(state, gymId);
      if (gym) Object.assign(gym, changes);
    },

    // ---------------- PASSWORD CHANGE (first-login flow) ----------------
    // Called once an owner sets their own password after the forced
    // first-login change (or anytime later, from a Profile/Settings
    // screen — clearing an already-false flag is a harmless no-op).
    setOwnerPassword: (state, action) => {
      const { gymId, newPassword } = action.payload;
      const gym = findGym(state, gymId);
      if (gym) {
        gym.ownerPassword = newPassword;
        gym.mustChangePassword = false;
      }
    },

    // Same idea, for a trainer changing THEIR OWN password — trainer
    // passwords live inside gym.trainers[], not on the gym itself, so
    // this needs both gymId (to find the gym) and trainerId (to find
    // the right trainer within it).
    setTrainerPassword: (state, action) => {
      const { gymId, trainerId, newPassword } = action.payload;
      const gym = findGym(state, gymId);
      if (!gym) return;
      const trainer = gym.trainers.find((t) => t.id === trainerId);
      if (trainer) {
        trainer.password = newPassword;
        trainer.mustChangePassword = false;
      }
    },
  },
});

export const {
  fetchGymsStart,
  fetchGymsSuccess,
  fetchGymsFailure,
  addGym,
  updateGym,
  deleteGym,
  addTrainer,
  updateTrainerField,
  removeTrainer,
  renewSubscription,
  updateGymFields,
  setOwnerPassword,
  setTrainerPassword,
} = gymSlice.actions;

export default gymSlice.reducer;