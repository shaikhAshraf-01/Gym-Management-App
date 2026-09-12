import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getMembersApi,
  addMemberApi,
  updateMemberApi,
  deleteMemberApi,
  deleteCurrentMembershipApi,
  extendMembershipApi,
  getDeletedMembersApi,
  restoreMemberApi,
  permanentDeleteMemberApi,
} from "../../api/memberApi";
import { sendBalanceReminderApi } from "../../api/ownerApi";

// ================= FETCH ALL MEMBERS =================

export const fetchMembers = createAsyncThunk(
  "members/fetchMembers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getMembersApi();
      return response.data.members;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch members.",
      );
    }
  },
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
        error.response?.data?.message || "Failed to add member.",
      );
    }
  },
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
        error.response?.data?.message || "Failed to update member.",
      );
    }
  },
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
        error.response?.data?.message || "Failed to delete member.",
      );
    }
  },
);

export const deleteCurrentMembership = createAsyncThunk(
  "members/deleteCurrentMembership",
  async (id, { rejectWithValue }) => {
    try {
      const response = await deleteCurrentMembershipApi(id);
      return response.data.member;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete current membership.",
      );
    }
  },
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
        error.response?.data?.message || "Failed to extend membership.",
      );
    }
  },
);

// ================= DELETED MEMBERS (owner only, Profile page) =================

export const fetchDeletedMembers = createAsyncThunk(
  "members/fetchDeletedMembers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getDeletedMembersApi();
      return response.data.members;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch deleted members.",
      );
    }
  },
);

export const restoreMember = createAsyncThunk(
  "members/restoreMember",
  async (id, { rejectWithValue }) => {
    try {
      const response = await restoreMemberApi(id);
      return response.data.member;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to restore member.",
      );
    }
  },
);

export const permanentDeleteMember = createAsyncThunk(
  "members/permanentDeleteMember",
  async (id, { rejectWithValue }) => {
    try {
      await permanentDeleteMemberApi(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to permanently delete member.",
      );
    }
  },
);

// Manual "Send Reminder" trigger for a member with a pending balance
// (Plus/Pro only — see ManageWhatsApp's Balance Reminder toggle).
export const sendBalanceReminder = createAsyncThunk(
  "members/sendBalanceReminder",
  async (memberId, { rejectWithValue }) => {
    try {
      await sendBalanceReminderApi(memberId);
      return memberId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to send reminder.",
      );
    }
  },
);

// Human-readable label for the `plan` code, used anywhere the UI
// wants "3 Months" instead of "3_month".
export const PLAN_LABELS = {
  "1_month": "1 Month",
  "3_month": "3 Months",
  "6_month": "6 Months",
  "1_year": "1 Year",
};

// Human-readable label for `admissionType` — used for the Offer
// badge (Members/Profile) and the Sales admission-type breakdown.
export const ADMISSION_TYPE_LABELS = {
  normal: "Normal",
  offer: "Offer",
};

const initialState = {
  members: [],
  loading: false,
  error: null,
  // Separate flag so a save/delete/extend spinner doesn't fight with
  // the main "Loading members..." full-page state.
  actionLoading: false,
  actionError: null,
  // Per-member ids currently sending a balance reminder, so only that
  // row's button shows a spinner (not a global lock).
  reminderSendingIds: [],
  reminderError: null,
  // ---- Deleted Members (owner only, Profile page) ----
  deletedMembers: [],
  deletedLoading: false,
  deletedError: null,
  deletedActionLoading: false,
  deletedActionError: null,
};

const membersSlice = createSlice({
  name: "members",
  initialState,
  reducers: {
    clearMemberActionError: (state) => {
      state.actionError = null;
    },
    clearReminderError: (state) => {
      state.reminderError = null;
    },
    // ---- Real-time (socket.io) reducers ----
    // Fired when ANOTHER device/session on the same gym (owner's other
    // device, or a trainer) adds/edits/renews a member. Same
    // upsert-by-id shape as the REST thunks above, so it's safe even
    // if this device's own action already applied the same change
    // (e.g. the server echoing our own write back to us too).
    memberUpserted: (state, action) => {
      const incoming = action.payload;
      const index = state.members.findIndex((m) => m.id === incoming.id);
      if (index !== -1) {
        state.members[index] = incoming;
      } else {
        state.members.unshift(incoming);
      }
    },
    memberRemoved: (state, action) => {
      state.members = state.members.filter((m) => m.id !== action.payload);
    },
    // Fired (via socket) when a member is restored from another
    // device/session — drop them from the Deleted Members list here;
    // the existing memberUpserted flow (member:restored also carries
    // the member) puts them back into the main list.
    deletedMemberRemoved: (state, action) => {
      state.deletedMembers = state.deletedMembers.filter(
        (m) => m.id !== action.payload,
      );
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
        const incoming = action.payload;
        const index = state.members.findIndex((m) => m.id === incoming.id);
        if (index !== -1) {
          state.members[index] = incoming;
        } else {
          state.members.unshift(incoming);
        }
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
        const index = state.members.findIndex(
          (m) => m.id === action.payload.id,
        );
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

      // ---------------- Delete Current Membership ----------------
      .addCase(deleteCurrentMembership.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(deleteCurrentMembership.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.members.findIndex(
          (m) => m.id === action.payload.id,
        );
        if (index !== -1) state.members[index] = action.payload;
      })
      .addCase(deleteCurrentMembership.rejected, (state, action) => {
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
        const index = state.members.findIndex(
          (m) => m.id === action.payload.id,
        );
        if (index !== -1) state.members[index] = action.payload;
      })
      .addCase(extendMembership.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })

      // ---------------- Fetch Deleted Members ----------------
      .addCase(fetchDeletedMembers.pending, (state) => {
        state.deletedLoading = true;
        state.deletedError = null;
      })
      .addCase(fetchDeletedMembers.fulfilled, (state, action) => {
        state.deletedLoading = false;
        state.deletedMembers = action.payload;
      })
      .addCase(fetchDeletedMembers.rejected, (state, action) => {
        state.deletedLoading = false;
        state.deletedError = action.payload;
      })

      // ---------------- Restore Member ----------------
      .addCase(restoreMember.pending, (state) => {
        state.deletedActionLoading = true;
        state.deletedActionError = null;
      })
      .addCase(restoreMember.fulfilled, (state, action) => {
        state.deletedActionLoading = false;
        state.deletedMembers = state.deletedMembers.filter(
          (m) => m.id !== action.payload.id,
        );
        const index = state.members.findIndex((m) => m.id === action.payload.id);
        if (index !== -1) {
          state.members[index] = action.payload;
        } else {
          state.members.unshift(action.payload);
        }
      })
      .addCase(restoreMember.rejected, (state, action) => {
        state.deletedActionLoading = false;
        state.deletedActionError = action.payload;
      })

      // ---------------- Permanent Delete Member ----------------
      .addCase(permanentDeleteMember.pending, (state) => {
        state.deletedActionLoading = true;
        state.deletedActionError = null;
      })
      .addCase(permanentDeleteMember.fulfilled, (state, action) => {
        state.deletedActionLoading = false;
        state.deletedMembers = state.deletedMembers.filter(
          (m) => m.id !== action.payload,
        );
      })
      .addCase(permanentDeleteMember.rejected, (state, action) => {
        state.deletedActionLoading = false;
        state.deletedActionError = action.payload;
      })

      // ---------------- Send Balance Reminder ----------------
      .addCase(sendBalanceReminder.pending, (state, action) => {
        state.reminderSendingIds.push(action.meta.arg);
        state.reminderError = null;
      })
      .addCase(sendBalanceReminder.fulfilled, (state, action) => {
        state.reminderSendingIds = state.reminderSendingIds.filter(
          (id) => id !== action.payload,
        );
      })
      .addCase(sendBalanceReminder.rejected, (state, action) => {
        state.reminderSendingIds = state.reminderSendingIds.filter(
          (id) => id !== action.meta.arg,
        );
        state.reminderError = action.payload;
      });
  },
});

export const {
  clearMemberActionError,
  clearReminderError,
  memberUpserted,
  memberRemoved,
  deletedMemberRemoved,
} = membersSlice.actions;

export default membersSlice.reducer;