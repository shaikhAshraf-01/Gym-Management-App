import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getOwnerProfileApi,
  uploadGymLogoApi,
  removeGymLogoApi,
  updateGymGstDetailsApi,
  addTrainerOwnerApi,
  updateTrainerOwnerApi,
  removeTrainerOwnerApi,
  connectWhatsappApi,
  disconnectWhatsappApi,
  updateWhatsappAutomationSettingsApi,
  updateGymPricingApi,
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

export const updateGymGstDetails = createAsyncThunk(
  "owner/updateGymGstDetails",
  async (gstNumber, { rejectWithValue }) => {
    try {
      const response = await updateGymGstDetailsApi(gstNumber);

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to save GST details.",
      );
    }
  },
);

export const addOwnerTrainer = createAsyncThunk(
  "owner/addTrainer",
  async (trainerData, { rejectWithValue }) => {
    try {
      const response = await addTrainerOwnerApi(trainerData);
      return response.data.trainers;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add trainer.",
      );
    }
  },
);

export const updateOwnerTrainer = createAsyncThunk(
  "owner/updateTrainer",
  async ({ trainerId, ...trainerData }, { rejectWithValue }) => {
    try {
      const response = await updateTrainerOwnerApi(trainerId, trainerData);
      return response.data.trainers;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update trainer.",
      );
    }
  },
);

export const removeOwnerTrainer = createAsyncThunk(
  "owner/removeTrainer",
  async (trainerId, { rejectWithValue }) => {
    try {
      const response = await removeTrainerOwnerApi(trainerId);
      return response.data.trainers;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to remove trainer.",
      );
    }
  },
);

// ---------------- WhatsApp automation ----------------

export const connectWhatsapp = createAsyncThunk(
  "owner/connectWhatsapp",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await connectWhatsappApi(payload);
      return response.data.gym;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to connect WhatsApp account.",
      );
    }
  },
);

export const disconnectWhatsapp = createAsyncThunk(
  "owner/disconnectWhatsapp",
  async (_, { rejectWithValue }) => {
    try {
      const response = await disconnectWhatsappApi();
      return response.data.gym;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to disconnect WhatsApp account.",
      );
    }
  },
);

export const updateWhatsappAutomationSettings = createAsyncThunk(
  "owner/updateWhatsappAutomationSettings",
  async (settings, { rejectWithValue }) => {
    try {
      const response = await updateWhatsappAutomationSettingsApi(settings);
      return response.data.gym;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to save WhatsApp automation settings.",
      );
    }
  },
);

export const updateGymPricing = createAsyncThunk(
  "owner/updateGymPricing",
  async (pricing, { rejectWithValue }) => {
    try {
      const response = await updateGymPricingApi(pricing);
      return response.data.gym;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to save pricing.",
      );
    }
  },
);

const initialState = {
  owner: null,
  gym: null,
  currentSubscription: null,
  trainers: [],
  loading: false,
  uploading: false,
  trainerActionLoading: false,
  trainerActionError: null,
  error: null,
  // Kept separate from `error` on purpose — `error` blocks the whole
  // profile page (used only when the initial fetch fails and there's
  // no data to show at all). uploadError is a non-blocking banner for
  // logo/photo upload failures, shown alongside the already-loaded
  // profile instead of hiding it.
  uploadError: null,
  gstActionLoading: false,
  gstActionError: null,
  whatsappActionLoading: false,
  whatsappActionError: null,
  pricingActionLoading: false,
  pricingActionError: null,
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
        const updatedGym = action.payload.gym;
        state.gym = updatedGym;

        // The payload carries the fresh subscription/trainers too
        // (e.g. admin just upgraded Basic -> Plus) — without this,
        // plan-gated UI (WhatsApp automation, Sales, etc.) stayed
        // stale until a manual page refresh re-fetched the profile.
        if (updatedGym.currentSubscription !== undefined) {
          state.currentSubscription = updatedGym.currentSubscription;
        }
        if (updatedGym.trainers !== undefined) {
          state.trainers = updatedGym.trainers;
        }
      }
    },
    clearTrainerActionError: (state) => {
      state.trainerActionError = null;
    },
    clearGstActionError: (state) => {
      state.gstActionError = null;
    },
    clearWhatsappActionError: (state) => {
      state.whatsappActionError = null;
    },
    // Realtime (socket.io): fired whenever this gym's trainer roster
    // changes — from the owner's own other device, a trainer's
    // profile edit, or the admin adding/removing a trainer.
    trainersUpdated: (state, action) => {
      const { gymId, trainers } = action.payload || {};
      if (!state.gym || !gymId || state.gym._id !== gymId) return;
      state.trainers = trainers;
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
        state.trainers = action.payload.trainers || [];
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
      .addCase(updateGymGstDetails.pending, (state) => {
        state.gstActionLoading = true;
        state.gstActionError = null;
      })
      .addCase(updateGymGstDetails.fulfilled, (state, action) => {
        state.gstActionLoading = false;
        if (state.gym) {
          state.gym.gstNumber = action.payload.gym?.gstNumber ?? "";
        }
      })
      .addCase(updateGymGstDetails.rejected, (state, action) => {
        state.gstActionLoading = false;
        state.gstActionError = action.payload;
      })
      // ---------------- Trainer management ----------------
      .addCase(addOwnerTrainer.pending, (state) => {
        state.trainerActionLoading = true;
        state.trainerActionError = null;
      })
      .addCase(addOwnerTrainer.fulfilled, (state, action) => {
        state.trainerActionLoading = false;
        state.trainers = action.payload;
      })
      .addCase(addOwnerTrainer.rejected, (state, action) => {
        state.trainerActionLoading = false;
        state.trainerActionError = action.payload;
      })
      .addCase(updateOwnerTrainer.pending, (state) => {
        state.trainerActionLoading = true;
        state.trainerActionError = null;
      })
      .addCase(updateOwnerTrainer.fulfilled, (state, action) => {
        state.trainerActionLoading = false;
        state.trainers = action.payload;
      })
      .addCase(updateOwnerTrainer.rejected, (state, action) => {
        state.trainerActionLoading = false;
        state.trainerActionError = action.payload;
      })
      .addCase(removeOwnerTrainer.pending, (state) => {
        state.trainerActionLoading = true;
        state.trainerActionError = null;
      })
      .addCase(removeOwnerTrainer.fulfilled, (state, action) => {
        state.trainerActionLoading = false;
        state.trainers = action.payload;
      })
      .addCase(removeOwnerTrainer.rejected, (state, action) => {
        state.trainerActionLoading = false;
        state.trainerActionError = action.payload;
      })
      // ---------------- WhatsApp automation ----------------
      .addCase(connectWhatsapp.pending, (state) => {
        state.whatsappActionLoading = true;
        state.whatsappActionError = null;
      })
      .addCase(connectWhatsapp.fulfilled, (state, action) => {
        state.whatsappActionLoading = false;
        if (state.gym) {
          state.gym.whatsappIntegration = action.payload.whatsappIntegration;
        }
      })
      .addCase(connectWhatsapp.rejected, (state, action) => {
        state.whatsappActionLoading = false;
        state.whatsappActionError = action.payload;
      })
      .addCase(disconnectWhatsapp.pending, (state) => {
        state.whatsappActionLoading = true;
        state.whatsappActionError = null;
      })
      .addCase(disconnectWhatsapp.fulfilled, (state, action) => {
        state.whatsappActionLoading = false;
        if (state.gym) {
          state.gym.whatsappIntegration = action.payload.whatsappIntegration;
          state.gym.whatsappAutomationSettings =
            action.payload.whatsappAutomationSettings;
        }
      })
      .addCase(disconnectWhatsapp.rejected, (state, action) => {
        state.whatsappActionLoading = false;
        state.whatsappActionError = action.payload;
      })
      .addCase(updateWhatsappAutomationSettings.pending, (state) => {
        state.whatsappActionLoading = true;
        state.whatsappActionError = null;
      })
      .addCase(updateWhatsappAutomationSettings.fulfilled, (state, action) => {
        state.whatsappActionLoading = false;
        if (state.gym) {
          state.gym.whatsappAutomationSettings =
            action.payload.whatsappAutomationSettings;
        }
      })
      .addCase(updateWhatsappAutomationSettings.rejected, (state, action) => {
        state.whatsappActionLoading = false;
        state.whatsappActionError = action.payload;
      })
      .addCase(updateGymPricing.pending, (state) => {
        state.pricingActionLoading = true;
        state.pricingActionError = null;
      })
      .addCase(updateGymPricing.fulfilled, (state, action) => {
        state.pricingActionLoading = false;
        if (state.gym) {
          state.gym.pricing = action.payload.pricing;
        }
      })
      .addCase(updateGymPricing.rejected, (state, action) => {
        state.pricingActionLoading = false;
        state.pricingActionError = action.payload;
      });
  },
});

export const {
  clearOwnerError,
  clearUploadError,
  gymProfileUpdated,
  clearTrainerActionError,
  clearGstActionError,
  clearWhatsappActionError,
  trainersUpdated,
} = ownerSlice.actions;

export default ownerSlice.reducer;