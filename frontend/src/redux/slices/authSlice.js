import { createSlice } from "@reduxjs/toolkit";

// Define exactly what the state should look like before logging in.
// NOTE: No `token` field for now — there's no backend yet to issue or
// verify one, so pretending to have a token would be misleading. Once
// a real backend exists and returns a JWT (or similar) on login, add
// `token: null` back here, include it in loginSuccess's payload, and
// add it back into the restoreSession validity check below.
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

      // Persist the essentials so a page refresh doesn't log the user
      // out. This is a MOCK session (no real backend/token behind it)
      // — fine for dev/demo, but note this isn't real security: anyone
      // can edit localStorage directly and grant themselves any role.
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

    // Called once, on app boot (e.g. in App.jsx's top-level useEffect),
    // to rehydrate state from localStorage BEFORE any protected route
    // renders. Without this, refreshing the page always bounces the
    // user back to /login even though they "logged in" a moment ago.
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
        // Corrupted/old-shape data in localStorage — clear it rather
        // than crash the app on boot.
        localStorage.removeItem("fitzone_auth");
      }
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, restoreSession } =
  authSlice.actions;
export default authSlice.reducer; // 👈 Crucial: This must be the default export