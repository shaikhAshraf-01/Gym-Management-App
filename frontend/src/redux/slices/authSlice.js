import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { adminLogin } from "../../api/authApi"; 
import { getAdminProfileApi, changeAdminPasswordApi } from "../../api/adminApi";

// ==========================================
// ====== ASYNC THUNKS (API LIFECYCLES) ======
// ==========================================

export const loginAdminThunk = createAsyncThunk(
  "auth/loginAdmin",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await adminLogin(credentials);
      return response.data; 
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Login failed. Please try again."
      );
    }
  }
);

// 2. Fetch Fresh Admin Profile Thunk (Corrected and Bulletproof)
export const fetchAdminProfile = createAsyncThunk(
  "auth/fetchAdminProfile",
  async (_, { rejectWithValue }) => {
    try {
      const stored = localStorage.getItem("fitzone_auth");
      let customHeaders = {};
      
      if (stored) {
        const { token } = JSON.parse(stored);
        if (token) {
          customHeaders = { Authorization: `Bearer ${token}` };
        }
      }

      // ✅ FIX: Use getAdminProfileApi and pass our freshly read fallback headers
      const response = await getAdminProfileApi(customHeaders);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch profile."
      );
    }
  }
);

// 3. Update Security Password Thunk (Corrected and Bulletproof)
export const changeAdminPassword = createAsyncThunk(
  "auth/changeAdminPassword",
  async (passwordData, { rejectWithValue }) => {
    try {
      // 🚀 THE FIX: Read the fresh token directly from localStorage right at this millisecond
      const stored = localStorage.getItem("fitzone_auth");
      let customHeaders = {};
      
      if (stored) {
        const { token } = JSON.parse(stored);
        if (token) {
          customHeaders = { Authorization: `Bearer ${token}` };
        }
      }

      // Pass the data payload and manually attach the fallback authorization headers
      const response = await changeAdminPasswordApi(passwordData, customHeaders);
      return response.data; 
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
    isInitialized: false
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

      // 1. If nothing is in local storage, initialize immediately and stop
      if (!stored) {
        state.isInitialized = true; // 🔓 Unlocks the loading spinner!
        state.isAuthenticated = false;
        return;
      }

      try {
        const { user, token, role } = JSON.parse(stored);

        if (user && token && role) {
          state.user = user;
          state.token = token;
          state.role = role;
          state.isAuthenticated = true;
        } else {
          // If the data structure is corrupt or incomplete, clean it up
          localStorage.removeItem("fitzone_auth");
          state.isAuthenticated = false;
        }
      } catch (error) {
        localStorage.removeItem("fitzone_auth");
        state.isAuthenticated = false;
      } finally {
        // 2. This guarantees the initialization completes no matter what!
        state.isInitialized = true;
      }
    },

  },

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
        state.user = action.payload.data; 
        
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
