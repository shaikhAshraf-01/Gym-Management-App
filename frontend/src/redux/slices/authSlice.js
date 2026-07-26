import { createSlice } from "@reduxjs/toolkit";

// Define exactly what the state should look like before logging in
const initialState = {
  user: null,              // Holds user profile objects (e.g. mobile number)
  role: null,              // Holds current role ('admin', 'owner', 'trainer')
  isAuthenticated: false,  // Boolean lock to protect routes
  loading: false,          // Track API call states
  error: null,             // Catch-all string for validation errors
};

const authSlice = createSlice({
  name: "auth",
  initialState, // 👈 Injects the default values instantly upon app boot
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.role = action.payload.role;
      state.error = null;
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.role = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;
export default authSlice.reducer; // 👈 Crucial: This must be the default export
