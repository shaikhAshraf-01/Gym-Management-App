import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getInquiriesApi,
  addInquiryApi,
  updateInquiryApi,
  deleteInquiryApi,
} from "../../api/inquiryApi";

// ================= FETCH ALL ENQUIRIES =================

export const fetchEnquiries = createAsyncThunk(
  "enquiries/fetchEnquiries",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getInquiriesApi();
      return response.data.enquiries;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch enquiries.",
      );
    }
  },
);

// ================= ADD ENQUIRY =================
// Called from EnquiryForm.jsx (via AddSelectionContainer's onSave prop)
// with { name, mobile, whenToJoin }.

export const addEnquiry = createAsyncThunk(
  "enquiries/addEnquiry",
  async (enquiryData, { rejectWithValue }) => {
    try {
      const response = await addInquiryApi(enquiryData);
      return response.data.enquiry;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add enquiry.",
      );
    }
  },
);

// ================= UPDATE ENQUIRY (inline "Change Date" edit) =================
// payload: { id, changes: { whenToJoin: "..." } } — same shape
// EnquiryView's handleSaveEdit already sends.

export const updateEnquiry = createAsyncThunk(
  "enquiries/updateEnquiry",
  async ({ id, changes }, { rejectWithValue }) => {
    try {
      const response = await updateInquiryApi(id, changes);
      return response.data.enquiry;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update enquiry.",
      );
    }
  },
);

// ================= DELETE ENQUIRY =================

export const deleteEnquiry = createAsyncThunk(
  "enquiries/deleteEnquiry",
  async (id, { rejectWithValue }) => {
    try {
      await deleteInquiryApi(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete enquiry.",
      );
    }
  },
);

const initialState = {
  enquiries: [],
  loading: false,
  error: null,
  actionLoading: false,
  actionError: null,
};

const enquiriesSlice = createSlice({
  name: "enquiries",
  initialState,
  reducers: {
    clearEnquiryActionError: (state) => {
      state.actionError = null;
    },
    // ---- Real-time (socket.io) reducers — see membersSlice for why ----
    enquiryUpserted: (state, action) => {
      const incoming = action.payload;
      const index = state.enquiries.findIndex((e) => e.id === incoming.id);
      if (index !== -1) {
        state.enquiries[index] = incoming;
      } else {
        state.enquiries.unshift(incoming);
      }
    },
    enquiryRemoved: (state, action) => {
      state.enquiries = state.enquiries.filter((e) => e.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // ---------------- Fetch Enquiries ----------------
      .addCase(fetchEnquiries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEnquiries.fulfilled, (state, action) => {
        state.loading = false;
        state.enquiries = action.payload;
      })
      .addCase(fetchEnquiries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ---------------- Add Enquiry ----------------
      .addCase(addEnquiry.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(addEnquiry.fulfilled, (state, action) => {
        state.actionLoading = false;
        const incoming = action.payload;
        const index = state.enquiries.findIndex((e) => e.id === incoming.id);
        if (index !== -1) {
          state.enquiries[index] = incoming;
        } else {
          state.enquiries.unshift(incoming);
        }
      })
      .addCase(addEnquiry.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })

      // ---------------- Update Enquiry ----------------
      .addCase(updateEnquiry.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(updateEnquiry.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.enquiries.findIndex(
          (e) => e.id === action.payload.id,
        );
        if (index !== -1) state.enquiries[index] = action.payload;
      })
      .addCase(updateEnquiry.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })

      // ---------------- Delete Enquiry ----------------
      .addCase(deleteEnquiry.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(deleteEnquiry.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.enquiries = state.enquiries.filter(
          (e) => e.id !== action.payload,
        );
      })
      .addCase(deleteEnquiry.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });
  },
});

export const { clearEnquiryActionError, enquiryUpserted, enquiryRemoved } =
  enquiriesSlice.actions;

export default enquiriesSlice.reducer;
