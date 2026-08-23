import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { adminLogin, getMeApi, logoutApi } from "../../api/authApi";
import { getAdminProfileApi, changeAdminPasswordApi } from "../../api/adminApi";
import { removeStoredToken } from "../../utils/secureStorage";

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

// 2. Fetch Fresh Admin Profile Thunk
export const fetchAdminProfile = createAsyncThunk(
  "auth/fetchAdminProfile",
  async (_, { rejectWithValue }) => {
    try {
      // No manual header needed anymore — the website sends its
      // httpOnly cookie automatically, and the APK's axios interceptor
      // already attaches its token from secure storage.
      const response = await getAdminProfileApi();
      return response.data;
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
      return response.data; 
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update password."
      );
    }
  }
);

// 4. Restore session on app boot.
//
// Neither platform can just read local data and trust it anymore:
// the website's cookie is httpOnly (JS literally cannot read it), and
// even the APK's token is worth re-validating against the server
// (tokenVersion may have been bumped, account may be gone, etc). So
// both platforms ask the backend "am I still logged in?" — the
// website via the auto-sent cookie, the APK via the axios
// interceptor's Authorization header (read from secure storage).
export const restoreSession = createAsyncThunk(
  "auth/restoreSession",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getMeApi();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Not logged in."
      );
    }
  }
);

// 5. Logout.
//
// A plain `dispatch(logout())` only clears in-memory Redux state — it
// can't touch the website's httpOnly cookie (by design, client JS
// can't) or the APK's secure storage (needs its own async call). This
// does all three: tell the backend to clear the cookie, clear the
// APK's stored token, then clear local state.
export const performLogout = () => async (dispatch) => {
  try {
    await logoutApi();
  } catch {
    // Even if this fails (e.g. already logged out, network hiccup),
    // still clear everything client-side below.
  }
  await removeStoredToken();
  dispatch(logout());
};


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

    // NOTE: this only sets in-memory state. The httpOnly cookie is
    // already set by the backend's Set-Cookie header on the login
    // response (website), and the APK is responsible for saving
    // `token` into secure storage itself right after this dispatch
    // (see LoginForm.jsx) — this reducer stays a plain, synchronous,
    // side-effect-free state update on purpose.
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.role = action.payload.role;
      state.error = null;
    },

    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Plain, synchronous, local-only reset. Use `performLogout()`
    // instead when you actually want to log the user out — this alone
    // does NOT clear the website's httpOnly cookie or the APK's
    // secure storage. (store.js resets the rest of the Redux state
    // whenever this exact action type fires — see its rootReducer.)
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.role = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
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
      })
      .addCase(loginAdminThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Session Restore Lifecycle ---
      .addCase(restoreSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.role = action.payload.user.role;
        state.isInitialized = true;
      })
      .addCase(restoreSession.rejected, (state) => {
        // No valid cookie/token — just means "not logged in", not an
        // error worth surfacing anywhere.
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.role = null;
        state.isInitialized = true;
      })

      // --- Profile Fetching Lifecycle ---
      .addCase(fetchAdminProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.data; 
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
} = authSlice.actions;

export default authSlice.reducer;