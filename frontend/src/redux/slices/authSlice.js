import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,               // Holds user profile object (mobile, name, gymId, etc.)
  role: null,                // 'admin' | 'owner' | 'trainer' — keep in sync with lib/constants.js ROLES
  isAuthenticated: false,    // Boolean lock to protect routes
  loading: false,            // Track API call states
  error: null,                // Catch-all string for validation/API errors
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

      localStorage.setItem(
        "fitzone_auth",
        JSON.stringify({
          user: action.payload.user,
          role: action.payload.role,
        })
      );
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
      localStorage.removeItem("fitzone_auth");
    },

    restoreSession: (state) => {
      const stored = localStorage.getItem("fitzone_auth");
      if (!stored) return;

      try {
        const { user, role } = JSON.parse(stored);
        if (user && role) {
          state.user = user;
          state.role = role;
          state.isAuthenticated = true;
        }
      } catch {
        
        localStorage.removeItem("fitzone_auth");
      }
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, restoreSession } =
  authSlice.actions;
export default authSlice.reducer; // 👈 Crucial: This must be the default export