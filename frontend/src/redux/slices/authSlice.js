import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { adminLogin } from "../../api/authApi"; // Adjust paths to match your folder structure
import { getAdminProfileApi, changeAdminPasswordApi } from "../../api/adminApi";

export const loginAdminThunk = createAsyncThunk(
  "auth/loginAdmin",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await adminLogin(credentials);
      return response.data; // Expects: { success: true, user, token, role }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Login failed. Please try again."
      );
    }
  }
);

// 2. Fetch Fresh Admin Profile Thunk
export const fetchAdminProfile = createAsyncThunk(
  "auth/fetchAdminProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getAdminProfileApi();
      return response.data; // Expects: { success: true, data: adminDoc }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch profile."
      );
    }
  }
);

// 3. Update Security Password Thunk
export const changeAdminPassword = createAsyncThunk(
  "auth/changeAdminPassword",
  async (passwordData, { rejectWithValue }) => {
    try {
      const response = await changeAdminPasswordApi(passwordData);
      return response.data; // Expects: { success: true, message: "..." }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update password."
      );
    }
  }
);

// ==========================================
// ============= AUTHENTICATION SLICE =======
// ==========================================

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
    // Basic synchronous login actions (if used alongside standard controllers)
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

    // Total session cleanup
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.role = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;

      localStorage.removeItem("fitzone_auth");
    },

    // Browser reload state persistence recovery hook
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

  // ==========================================
  // ========== ASYNC EXTRA REDUCERS ==========
  // ==========================================
  extraReducers: (builder) => {
    builder
      // --- Login Lifecycle ---
      .addCase(loginAdminThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAdminThunk.fulfilled, (state, action) => {
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
      })
      .addCase(loginAdminThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Profile Fetching Lifecycle ---
      .addCase(fetchAdminProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.data; // Syncs fresh MongoDB document profile fields to Redux state
        
        // Keeps localStorage profile fields updated
        const stored = JSON.parse(localStorage.getItem("fitzone_auth") || "{}");
        localStorage.setItem(
          "fitzone_auth",
          JSON.stringify({ ...stored, user: action.payload.data })
        );
      })
      .addCase(fetchAdminProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Change Password Lifecycle ---
      .addCase(changeAdminPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changeAdminPassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(changeAdminPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
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
