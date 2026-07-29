import { createSlice } from "@reduxjs/toolkit";

// ------------------------------------------------------------------
// membersSlice — Owner domain.
// Holds the member list that MembersView.jsx (table) and
// OwnerDashboard.jsx (expiring-soon widget) both read from — used by
// BOTH the owner and trainer roles (same views, same data).
//
// Every member now carries a `membershipHistory` array — one entry
// per "joined" or "extended" event, each stamped with `by` (the
// owner/trainer name who performed it) so MembersView's View button
// can show "who added him" and his last few membership events.
// ------------------------------------------------------------------

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
      addedBy: "Sajid Shaikh",
      membershipHistory: [
        {
          id: "HIST-1",
          type: "joined",
          plan: "3_month",
          startDate: "2026-06-01",
          endDate: "2026-09-01",
          amount: "4500",
          paymentMode: "upi",
          by: "Sajid Shaikh",
          date: "2026-06-01",
        },
      ],
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
      addedBy: "Sanjay Patil",
      membershipHistory: [
        {
          id: "HIST-2",
          type: "joined",
          plan: "1_year",
          startDate: "2026-01-15",
          endDate: "2027-01-15",
          amount: "12000",
          paymentMode: "cash",
          by: "Sanjay Patil",
          date: "2026-01-15",
        },
      ],
    },
  ],
  loading: false,
  error: null,
};

// Human-readable label for the `plan` code, used anywhere the UI
// wants "3 Months" instead of "3_month".
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
    // Called from MembershipForm.jsx (via AddSelectionContainer) with
    // the fully-built form data PLUS `addedBy` (the logged-in owner/
    // trainer's name). Seeds membershipHistory with the "joined" event
    // so the View modal always has at least one entry to show.
    addMember: {
      reducer: (state, action) => {
        state.members.push(action.payload);
      },
      prepare: (memberData) => {
        const id = `MEM-${Date.now()}`;
        const by = memberData.addedBy || "Unknown";
        return {
          payload: {
            id,
            ...memberData,
            addedBy: by,
            membershipHistory: [
              {
                id: `HIST-${Date.now()}`,
                type: "joined",
                plan: memberData.plan,
                startDate: memberData.joiningDate,
                endDate: memberData.expiryDate,
                amount: memberData.planAmount,
                paymentMode: memberData.paymentMode,
                by,
                date: memberData.joiningDate,
              },
            ],
          },
        };
      },
    },

    // ---------------- UPDATE MEMBER (generic field patch) ----------------
    // Used by EditMemberModal for direct field edits — does NOT touch
    // membershipHistory, since a manual edit isn't a "membership event".
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
    // Replaces the old months-only extendMember reducer. Called from
    // ExtendMembershipModal (via MembersView / OwnerDashboard) with the
    // full extension details. Computes the new expiry itself (extends
    // from whichever is later — today, or the current expiry — so
    // extending early doesn't waste time still left), rolls the fee
    // into planAmount/amountPayingToday, and appends an "extended"
    // entry to membershipHistory stamped with who did it.
    // payload: { id, plan, extensionAmount, amountPayingToday, balanceAmount, paymentMode, addedBy }
    extendMembership: (state, action) => {
      const { id, plan, extensionAmount, amountPayingToday, balanceAmount, paymentMode, addedBy } = action.payload;
      const member = state.members.find((m) => m.id === id);
      if (!member) return;

      let monthsToAdd = 1;
      if (plan === "3_month") monthsToAdd = 3;
      if (plan === "6_month") monthsToAdd = 6;
      if (plan === "1_year") monthsToAdd = 12;

      const today = new Date();
      const currentExpiry = member.expiryDate ? new Date(member.expiryDate) : today;
      const startFrom = currentExpiry > today ? currentExpiry : today;

      const newExpiry = new Date(startFrom);
      newExpiry.setMonth(newExpiry.getMonth() + monthsToAdd);
      const newExpiryStr = newExpiry.toISOString().split("T")[0];
      const startDateStr = startFrom.toISOString().split("T")[0];
      const todayStr = today.toISOString().split("T")[0];

      const prevExpiry = member.expiryDate;

      member.plan = plan;
      member.expiryDate = newExpiryStr;
      member.planAmount = String(Number(member.planAmount || 0) + Number(extensionAmount || 0));
      member.amountPayingToday = String(Number(member.amountPayingToday || 0) + Number(amountPayingToday || 0));
      member.balanceAmount = balanceAmount;
      member.paymentMode = paymentMode;

      if (!member.membershipHistory) member.membershipHistory = [];
      member.membershipHistory.push({
        id: `HIST-${Date.now()}`,
        type: "extended",
        plan,
        startDate: prevExpiry || startDateStr,
        endDate: newExpiryStr,
        amount: extensionAmount,
        paymentMode,
        by: addedBy || "Unknown",
        date: todayStr,
      });
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
  extendMembership,
} = membersSlice.actions;

export default membersSlice.reducer;