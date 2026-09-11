import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createOfferApi,
  listOffersApi,
  getAudienceCountApi,
  cancelOfferApi,
} from "../../api/ownerApi";

export const fetchOffers = createAsyncThunk(
  "offers/fetchOffers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await listOffersApi();
      return response.data.offers;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch offers.");
    }
  },
);

export const createOffer = createAsyncThunk(
  "offers/createOffer",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await createOfferApi(payload);
      return response.data.offer;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to schedule offer.");
    }
  },
);

export const cancelOffer = createAsyncThunk(
  "offers/cancelOffer",
  async (offerId, { rejectWithValue }) => {
    try {
      const response = await cancelOfferApi(offerId);
      return response.data.offer;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to cancel offer.");
    }
  },
);

// Not stored long-term in state — just resolved on demand while the
// form is open, so the component reads it straight from the
// fulfilled action rather than a persisted slice field.
export const fetchAudienceCount = createAsyncThunk(
  "offers/fetchAudienceCount",
  async (audience, { rejectWithValue }) => {
    try {
      const response = await getAudienceCountApi(audience);
      return response.data.count;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to count audience.");
    }
  },
);

const initialState = {
  offers: [],
  loading: false,
  error: null,
  actionLoading: false,
  actionError: null,
  audienceCount: null,
  audienceCountLoading: false,
};

const offersSlice = createSlice({
  name: "offers",
  initialState,
  reducers: {
    clearOfferActionError: (state) => {
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOffers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOffers.fulfilled, (state, action) => {
        state.loading = false;
        state.offers = action.payload;
      })
      .addCase(fetchOffers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createOffer.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(createOffer.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.offers.unshift(action.payload);
      })
      .addCase(createOffer.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })

      .addCase(cancelOffer.fulfilled, (state, action) => {
        const index = state.offers.findIndex((o) => o._id === action.payload._id);
        if (index !== -1) state.offers[index] = action.payload;
      })
      .addCase(cancelOffer.rejected, (state, action) => {
        state.actionError = action.payload;
      })

      .addCase(fetchAudienceCount.pending, (state) => {
        state.audienceCountLoading = true;
      })
      .addCase(fetchAudienceCount.fulfilled, (state, action) => {
        state.audienceCountLoading = false;
        state.audienceCount = action.payload;
      })
      .addCase(fetchAudienceCount.rejected, (state) => {
        state.audienceCountLoading = false;
        state.audienceCount = null;
      });
  },
});

export const { clearOfferActionError } = offersSlice.actions;
export default offersSlice.reducer;