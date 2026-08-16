import { combineReducers, configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import gymsReducer from "./slices/gymSlice";
import membersReducer from "./slices/membersSlice";
import enquiriesReducer from "./slices/enquiriesSlice";
import ownerReducer from "./slices/ownerSlice"
import uiReducer from "./slices/uiSlice"

const appReducer = combineReducers({
  auth: authReducer,
  gyms: gymsReducer,
  members: membersReducer,      // ← this key must be exactly "members"
  enquiries: enquiriesReducer,
  owner: ownerReducer,
  ui: uiReducer,
});

// -----------------------------------------------------------------------
// Without this wrapper, only the `auth` slice gets cleared on logout —
// members/gyms/owner/enquiries stay in memory since this is an SPA and
// never does a full page reload. So logging out of Gym A and logging
// into Gym B showed Gym A's members/profile until a manual refresh.
//
// Resetting to every slice's initialState on "auth/logout" fixes that —
// but authSlice's initialState has isInitialized: false, and that flag
// only ever gets set to true once, in App.jsx's mount-time
// restoreSession() dispatch. Since logout doesn't remount <App/>, a
// full reset was leaving isInitialized stuck at false forever, which
// made ProtectedRoute/Login show their boot spinner forever after
// logout instead of the login form. So: reset everything, then patch
// isInitialized back to true (this session has already initialized).
// -----------------------------------------------------------------------
const rootReducer = (state, action) => {
  if (action.type === "auth/logout") {
    const resetState = appReducer(undefined, action);

    return {
      ...resetState,
      auth: {
        ...resetState.auth,
        isInitialized: true,
      },
    };
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
});