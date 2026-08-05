import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getAllGymsApi,
  updateGymApi,
  deleteGymApi,
  createGymApi,
  addTrainerApi,
  deleteTrainerApi,
} from "../../api/adminApi";
// ^ Adjust this import path to wherever your adminApi.js actually lives.

// Small helper so we don't repeat the localStorage/token logic in every thunk
const getAuthHeaders = () => {
  const stored = localStorage.getItem("fitzone_auth");
  if (!stored) return {};

  const { token } = JSON.parse(stored);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ================= FETCH ALL GYMS =================

export const fetchGyms = createAsyncThunk(
  "gyms/fetchGyms",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getAllGymsApi(getAuthHeaders());
      return response.data.gyms;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch gyms."
      );
    }
  }
);

// ================= CREATE GYM =================
// AddGyms.jsx can either call createGymApi directly, or dispatch this
// thunk instead — either way it hits the same endpoint. Included here
// so the whole gym lifecycle lives in one place.

export const createGym = createAsyncThunk(
  "gyms/createGym",
  async (gymData, { rejectWithValue }) => {
    try {
      const response = await createGymApi(gymData, getAuthHeaders());
      return response.data.gym;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create gym."
      );
    }
  }
);

// ================= UPDATE GYM =================
// Takes the full edited gym object (as built in the drawer),
// sends it to the backend, and returns the SAVED gym from the
// server response so local state matches what's actually in the DB.

export const updateGym = createAsyncThunk(
  "gyms/updateGym",
  async (gymData, { rejectWithValue }) => {
    try {
      const response = await updateGymApi(gymData._id, gymData, getAuthHeaders());
      return response.data.gym;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update gym."
      );
    }
  }
);

// ================= DELETE GYM =================

export const deleteGym = createAsyncThunk(
  "gyms/deleteGym",
  async (gymId, { rejectWithValue }) => {
    try {
      await deleteGymApi(gymId, getAuthHeaders());
      return gymId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete gym."
      );
    }
  }
);

// ================= ADD TRAINER =================
// Used by AddTrainerModal to add a single trainer to an EXISTING gym
// without going through the full gym-update flow. Expects
// { gymId, trainer: { name, mobile, email } }.

export const addTrainer = createAsyncThunk(
  "gyms/addTrainer",
  async ({ gymId, trainer }, { rejectWithValue }) => {
    try {
      const response = await addTrainerApi(gymId, trainer, getAuthHeaders());
      // backend returns the updated gym (with trainers[] already updated)
      return response.data.gym;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add trainer."
      );
    }
  }
);

// ================= REMOVE TRAINER =================
// Used by OwnerProfile to remove a trainer from a gym. Expects
// { gymId, trainerId }.

export const removeTrainer = createAsyncThunk(
  "gyms/removeTrainer",
  async ({ gymId, trainerId }, { rejectWithValue }) => {
    try {
      const response = await deleteTrainerApi(gymId, trainerId, getAuthHeaders());
      // backend returns the updated gym (with trainers[] already updated)
      return response.data.gym;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to remove trainer."
      );
    }
  }
);

const initialState = {
  gyms: [],
  loading: false,
  error: null,
  // Separate flags so a save/delete/create spinner doesn't fight with
  // the main "Loading gyms..." full-page state.
  actionLoading: false,
  actionError: null,
};

const gymSlice = createSlice({
  name: "gyms",
  initialState,

  reducers: {
    // Used for any manual/optimistic insert if ever needed outside
    // the createGym thunk (kept for backward compatibility).
    addGym: (state, action) => {
      state.gyms.unshift(action.payload);
    },
    clearActionError: (state) => {
      state.actionError = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // ---------------- Fetch Gyms ----------------
      .addCase(fetchGyms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGyms.fulfilled, (state, action) => {
        state.loading = false;
        state.gyms = action.payload;
      })
      .addCase(fetchGyms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ---------------- Create Gym ----------------
      .addCase(createGym.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(createGym.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.gyms.unshift(action.payload);
      })
      .addCase(createGym.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })

      // ---------------- Update Gym ----------------
      .addCase(updateGym.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(updateGym.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.gyms.findIndex(
          (gym) => gym._id === action.payload._id
        );
        if (index !== -1) {
          state.gyms[index] = { ...state.gyms[index], ...action.payload };
        }
      })
      .addCase(updateGym.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })

      // ---------------- Delete Gym ----------------
      .addCase(deleteGym.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(deleteGym.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.gyms = state.gyms.filter((gym) => gym._id !== action.payload);
      })
      .addCase(deleteGym.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })

      // ---------------- Add Trainer ----------------
      .addCase(addTrainer.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(addTrainer.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.gyms.findIndex(
          (gym) => gym._id === action.payload._id
        );
        if (index !== -1) {
          state.gyms[index] = { ...state.gyms[index], ...action.payload };
        }
      })
      .addCase(addTrainer.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })

      // ---------------- Remove Trainer ----------------
      .addCase(removeTrainer.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(removeTrainer.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.gyms.findIndex(
          (gym) => gym._id === action.payload._id
        );
        if (index !== -1) {
          state.gyms[index] = { ...state.gyms[index], ...action.payload };
        }
      })
      .addCase(removeTrainer.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });
  },
});

export const { addGym, clearActionError } = gymSlice.actions;

export default gymSlice.reducer;