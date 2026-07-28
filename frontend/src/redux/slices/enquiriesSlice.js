import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  enquiries: [
    {
      id: "ENQ-1",
      name: "Rahul Sharma",
      mobile: "9876543211",
      enquiryAddDate: "2026-07-25",
      whenToJoin: "Tomorrow",
    },
    {
      id: "ENQ-2",
      name: "Amit Patel",
      mobile: "9123456780",
      enquiryAddDate: "2026-07-27",
      whenToJoin: "Next Week",
    },
  ],
  loading: false,
  error: null,
};

const enquiriesSlice = createSlice({
  name: "enquiries",
  initialState,
  reducers: {
    // ---------------- LOADING STATE (for when a real API exists) ----------------
    fetchEnquiriesStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchEnquiriesSuccess: (state, action) => {
      state.loading = false;
      state.enquiries = action.payload;
    },
    fetchEnquiriesFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    // ---------------- ADD ENQUIRY ----------------
    addEnquiry: {
      reducer: (state, action) => {
        state.enquiries.push(action.payload);
      },
      prepare: (enquiryData) => ({
        payload: {
          id: `ENQ-${Date.now()}`,
          enquiryAddDate: new Date().toISOString().split("T")[0],
          ...enquiryData,
        },
      }),
    },
    // ---------------- UPDATE ENQUIRY (e.g. inline "Change Date" edit) ----------------
    updateEnquiry: (state, action) => {
      const { id, changes } = action.payload;
      const enquiry = state.enquiries.find((e) => e.id === id);
      if (enquiry) Object.assign(enquiry, changes);
    },
    // ---------------- DELETE ENQUIRY ----------------
    deleteEnquiry: (state, action) => {
      state.enquiries = state.enquiries.filter((e) => e.id !== action.payload);
    },
  },
});

export const {
  fetchEnquiriesStart,
  fetchEnquiriesSuccess,
  fetchEnquiriesFailure,
  addEnquiry,
  updateEnquiry,
  deleteEnquiry,
} = enquiriesSlice.actions;

export default enquiriesSlice.reducer;