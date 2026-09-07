import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getOwnerProfileApi,
  uploadGymLogoApi,
  removeGymLogoApi,
} from "../../api/ownerApi";

// ❌ REMOVED: getAuthHeaders() is no longer needed because 
// your Axios request interceptor attaches the Authorization token automatically!

export const fetchOwnerProfile = createAsyncThunk(
  "owner/fetchOwnerProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getOwnerProfileApi(); // Clean & direct call

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch owner profile.",
      );
    }
  },
);

export const uploadGymLogo = createAsyncThunk(
  "owner/uploadGymLogo",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await uploadGymLogoApi(formData);

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Logo upload failed.",
      );
    }
  },
);

export const removeGymLogo = createAsyncThunk(
  "owner/removeGymLogo",
  async (_, { rejectWithValue }) => {
    try {
      const response = await removeGymLogoApi();

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to remove logo.",
      );
    }
  },
);

const initialState = {
  owner: null,
  gym: null,
  currentSubscription: null,
  loading: false,
  uploading: false,
  error: null,
  // Kept separate from `error` on purpose — `error` blocks the whole
  // profile page (used only when the initial fetch fails and there's
  // no data to show at all). uploadError is a non-blocking banner for
  // logo/photo upload failures, shown alongside the already-loaded
  // profile instead of hiding it.
  uploadError: null,
};

const ownerSlice = createSlice({
  name: "owner",
  initialState,
  reducers: {
    clearOwnerError: (state) => {
      state.error = null;
    },
    clearUploadError: (state) => {
      state.uploadError = null;
    },
    gymProfileUpdated: (state, action) => {
      if (state.gym && action.payload?.gym?._id === state.gym._id) {
        state.gym = action.payload.gym;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOwnerProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOwnerProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.owner = action.payload.owner;
        state.gym = action.payload.gym;
        state.currentSubscription = action.payload.currentSubscription;
      })
      .addCase(fetchOwnerProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(uploadGymLogo.pending, (state) => {
        state.uploading = true;
      })
      .addCase(uploadGymLogo.fulfilled, (state, action) => {
        state.uploading = false;
        if (state.gym) {
          state.gym.gymLogo = action.payload.gymLogo;
        }
      })
      .addCase(uploadGymLogo.rejected, (state, action) => {
        state.uploading = false;
        state.uploadError = action.payload;
      })
      .addCase(removeGymLogo.pending, (state) => {
        state.uploading = true;
      })
      .addCase(removeGymLogo.fulfilled, (state) => {
        state.uploading = false;
        if (state.gym) {
          state.gym.gymLogo = "";
          state.gym.gymLogoPublicId = "";
        }
      })
      .addCase(removeGymLogo.rejected, (state, action) => {
        state.uploading = false;
        state.uploadError = action.payload;
      })
      ;
  },
});

export const { clearOwnerError, clearUploadError, gymProfileUpdated } = ownerSlice.actions;

export default ownerSlice.reducer;