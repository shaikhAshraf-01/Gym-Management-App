import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice"; // We will create this next
import gymReducer from "./slices/gymSlice"
export const store = configureStore({
  reducer: {
    auth: authReducer,
    gyms:gymReducer,
  },
});
