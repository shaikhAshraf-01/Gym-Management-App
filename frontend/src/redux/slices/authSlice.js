import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  token: null,
  role: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },

    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.role = action.payload.role;
      state.error = null;

      localStorage.setItem(
        "fitzone_auth",
        JSON.stringify({
          user: action.payload.user,
          token: action.payload.token,
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
      state.token = null;
      state.role = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;

      localStorage.removeItem("fitzone_auth");
    },

    restoreSession: (state) => {
      const stored = localStorage.getItem("fitzone_auth");

      if (!stored) return;

      try {
        const { user, token, role } = JSON.parse(stored);

        if (user && token && role) {
          state.user = user;
          state.token = token;
          state.role = role;
          state.isAuthenticated = true;
        }
      } catch (error) {
        localStorage.removeItem("fitzone_auth");
      }
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  restoreSession,
} = authSlice.actions;

export default authSlice.reducer;