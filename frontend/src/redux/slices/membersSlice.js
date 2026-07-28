import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  members: [
    {
      id: "MEM-1",
      name: "John Doe",
      mobile: "9876543210",
      age: 24,
      plan: "3_month",
      planAmount: "4500",
      amountPayingToday: "3000",
      balanceAmount: "1500",
      paymentMode: "upi",
      joiningDate: "2026-06-01",
      expiryDate: "2026-09-01",
    },
    {
      id: "MEM-2",
      name: "Jane Smith",
      mobile: "9123456789",
      age: 29,
      plan: "1_year",
      planAmount: "12000",
      amountPayingToday: "12000",
      balanceAmount: "0",
      paymentMode: "cash",
      joiningDate: "2026-01-15",
      expiryDate: "2027-01-15",
    },
  ],
  loading: false,
  error: null,
};


export const PLAN_LABELS = {
  "1_month": "1 Month",
  "3_month": "3 Months",
  "6_month": "6 Months",
  "1_year": "1 Year",
};

const membersSlice = createSlice({
  name: "members",
  initialState,
  reducers: {
    // ---------------- LOADING STATE (for when a real API exists) ----------------
    fetchMembersStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchMembersSuccess: (state, action) => {
      state.loading = false;
      state.members = action.payload;
    },
    fetchMembersFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    // ---------------- ADD MEMBER ----------------
    addMember: {
      reducer: (state, action) => {
        state.members.push(action.payload);
      },
      prepare: (memberData) => ({
        payload: { id: `MEM-${Date.now()}`, ...memberData },
      }),
    },

    // ---------------- UPDATE MEMBER (generic field patch) ----------------
    // payload: { id, changes: { field: value, ... } }
    updateMember: (state, action) => {
      const { id, changes } = action.payload;
      const member = state.members.find((m) => m.id === id);
      if (member) Object.assign(member, changes);
    },

    // ---------------- DELETE MEMBER ----------------
    deleteMember: (state, action) => {
      state.members = state.members.filter((m) => m.id !== action.payload);
    },
    // ---------------- EXTEND MEMBERSHIP ----------------
    extendMember: (state, action) => {
      const { id, months } = action.payload;
      const member = state.members.find((m) => m.id === id);
      if (!member) return;

      const today = new Date();
      const base = member.expiryDate ? new Date(member.expiryDate) : today;
      const startFrom = base > today ? base : today;

      const newExpiry = new Date(startFrom);
      newExpiry.setMonth(newExpiry.getMonth() + months);

      member.expiryDate = newExpiry.toISOString().split("T")[0];
    },
  },
});

export const {
  fetchMembersStart,
  fetchMembersSuccess,
  fetchMembersFailure,
  addMember,
  updateMember,
  deleteMember,
  extendMember,
} = membersSlice.actions;

export default membersSlice.reducer;