import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getOwnerProfileApi, uploadGymLogoApi } from "../../api/ownerApi";

const getAuthHeaders = () => {
  const stored = localStorage.getItem("fitzone_auth");

  if (!stored) return {};

  const { token } = JSON.parse(stored);

  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchOwnerProfile = createAsyncThunk(
  "owner/fetchOwnerProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getOwnerProfileApi(getAuthHeaders());

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
      const response = await uploadGymLogoApi(formData, getAuthHeaders());

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Logo upload failed.",
      );
    }
  },
);

const initialState = {
  owner: null,
  gym: null,
  currentSubscription: null,
  loading: false,
  error: null,
};
const ownerSlice = createSlice({
  name: "owner",
  initialState,
  reducers: {
    clearOwnerError: (state) => {
      state.error = null;
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
        state.loading = true;
      })

      .addCase(uploadGymLogo.fulfilled, (state, action) => {
        state.loading = false;

        if (state.gym) {
          state.gym.gymLogo = action.payload.gymLogo;
        }
      })

      .addCase(uploadGymLogo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});
export const { clearOwnerError } = ownerSlice.actions;

export default ownerSlice.reducer;
