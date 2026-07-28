import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  gyms: [
   
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

    addGym: (state, action) => {
      state.gyms.push(action.payload);
    },

    updateGym: (state, action) => {
      const index = state.gyms.findIndex((g) => g.id === action.payload.id);
      if (index !== -1) state.gyms[index] = action.payload;
    },

    // ---------------- DELETE GYM ----------------
    deleteGym: (state, action) => {
      state.gyms = state.gyms.filter((g) => g.id !== action.payload);
    },

    addTrainer: (state, action) => {
      const { gymId, trainer } = action.payload;
      const gym = findGym(state, gymId);
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

    updateGymFields: (state, action) => {
      const { gymId, changes } = action.payload;
      const gym = findGym(state, gymId);
      if (gym) Object.assign(gym, changes);
    },

    setOwnerPassword: (state, action) => {
      const { gymId, newPassword } = action.payload;
      const gym = findGym(state, gymId);
      if (gym) {
        gym.ownerPassword = newPassword;
        gym.mustChangePassword = false;
      }
    },

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