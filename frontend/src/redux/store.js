import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import gymsReducer from "./slices/gymSlice";
import membersReducer from "./slices/membersSlice";
import enquiriesReducer from "./slices/enquiriesSlice";
import ownerReducer from "./slices/ownerSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    gyms: gymsReducer,
    members: membersReducer,      // ← this key must be exactly "members"
    enquiries: enquiriesReducer,
    owner: ownerReducer,
  },
});