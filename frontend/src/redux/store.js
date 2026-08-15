import { combineReducers, configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import gymsReducer from "./slices/gymSlice";
import membersReducer from "./slices/membersSlice";
import enquiriesReducer from "./slices/enquiriesSlice";
import ownerReducer from "./slices/ownerSlice"

const appReducer = combineReducers({
  auth: authReducer,
  gyms: gymsReducer,
  members: membersReducer,      // ← this key must be exactly "members"
  enquiries: enquiriesReducer,
  owner: ownerReducer,
});

// -----------------------------------------------------------------------
// Without this wrapper, only the `auth` slice gets cleared on logout —
// members/gyms/owner/enquiries stay in memory since this is an SPA and
// never does a full page reload. So logging out of Gym A and logging
// into Gym B showed Gym A's members/profile until a manual refresh.
//
// Setting state to `undefined` on "auth/logout" makes every slice fall
// back to its own initialState, so the next login starts on a clean
// store and each screen's "if (data.length === 0) fetch()" guards
// correctly re-fetch fresh data for the newly logged-in gym.
// -----------------------------------------------------------------------
const rootReducer = (state, action) => {
  if (action.type === "auth/logout") {
    state = undefined;
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
});