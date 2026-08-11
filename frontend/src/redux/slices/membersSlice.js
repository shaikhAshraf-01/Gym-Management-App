import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getMembersApi,
  addMemberApi,
  updateMemberApi,
  deleteMemberApi,
  extendMembershipApi,
} from "../../api/memberApi";

// ================= FETCH ALL MEMBERS =================

export const fetchMembers = createAsyncThunk(
  "members/fetchMembers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getMembersApi();
      return response.data.members;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch members."
      );
    }
  }
);

// ================= ADD MEMBER =================
// Called from MembershipForm.jsx (via AddSelectionContainer) with the
// raw form data. `addedBy` is stamped server-side from the auth
// token, but we still pass it through here — harmless, backend just
// ignores it and uses req.user instead.

export const addMember = createAsyncThunk(
  "members/addMember",
  async (memberData, { rejectWithValue }) => {
    try {
      const response = await addMemberApi(memberData);
      return response.data.member;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add member."
      );
    }
  }
);

// ================= UPDATE MEMBER (generic field patch) =================
// payload: { id, changes: { field: value, ... } } — same shape
// EditMemberModal already sends via handleSaveEdit.

export const updateMember = createAsyncThunk(
  "members/updateMember",
  async ({ id, changes }, { rejectWithValue }) => {
    try {
      const response = await updateMemberApi(id, changes);
      return response.data.member;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update member."
      );
    }
  }
);

// ================= DELETE MEMBER =================

export const deleteMember = createAsyncThunk(
  "members/deleteMember",
  async (id, { rejectWithValue }) => {
    try {
      await deleteMemberApi(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete member."
      );
    }
  }
);

// ================= EXTEND MEMBERSHIP =================
// payload: { id, plan, extensionAmount, amountPayingToday,
// balanceAmount, paymentMode, addedBy } — same shape MembersView /
// OwnerDashboard already dispatch (addedBy is extra/unused now, harmless).

export const extendMembership = createAsyncThunk(
  "members/extendMembership",
  async ({ id, ...extensionPayload }, { rejectWithValue }) => {
    try {
      const response = await extendMembershipApi(id, extensionPayload);
      return response.data.member;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to extend membership."
      );
    }
  }
);

// Human-readable label for the `plan` code, used anywhere the UI
// wants "3 Months" instead of "3_month".
export const PLAN_LABELS = {
  "1_month": "1 Month",
  "3_month": "3 Months",
  "6_month": "6 Months",
  "1_year": "1 Year",
};

const initialState = {
  members: [],
  loading: false,
  error: null,
  // Separate flag so a save/delete/extend spinner doesn't fight with
  // the main "Loading members..." full-page state.
  actionLoading: false,
  actionError: null,
};

const membersSlice = createSlice({
  name: "members",
  initialState,
  reducers: {
    clearMemberActionError: (state) => {
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ---------------- Fetch Members ----------------
      .addCase(fetchMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.members = action.payload;
      })
      .addCase(fetchMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ---------------- Add Member ----------------
      .addCase(addMember.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(addMember.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.members.unshift(action.payload);
      })
      .addCase(addMember.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })

      // ---------------- Update Member ----------------
      .addCase(updateMember.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(updateMember.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.members.findIndex((m) => m.id === action.payload.id);
        if (index !== -1) state.members[index] = action.payload;
      })
      .addCase(updateMember.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })

      // ---------------- Delete Member ----------------
      .addCase(deleteMember.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(deleteMember.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.members = state.members.filter((m) => m.id !== action.payload);
      })
      .addCase(deleteMember.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })

      // ---------------- Extend Membership ----------------
      .addCase(extendMembership.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(extendMembership.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.members.findIndex((m) => m.id === action.payload.id);
        if (index !== -1) state.members[index] = action.payload;
      })
      .addCase(extendMembership.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });
  },
});

export const { clearMemberActionError } = membersSlice.actions;

export default membersSlice.reducer;