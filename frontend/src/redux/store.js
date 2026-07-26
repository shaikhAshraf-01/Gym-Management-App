import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice"; // We will create this next

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});
