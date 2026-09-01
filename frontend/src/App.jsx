import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Capacitor } from "@capacitor/core";
import { restoreSession } from "./redux/slices/authSlice";
import useRealtimeSync from "./hooks/useRealtimeSync";

// 🚀 ADDED: The missing Protected Route file import statement
import ProtectedRoute from "./pages/protectedRoute"; 
import BackButtonHandler from "./pages/BackButtonHandler";

import Login from "./pages/Login";
import Home from "./pages/Home";
//admin routes
import AdminLayout from "./layouts/adminLayout/AdminLayout";
import AdminDashboard from "./components/adminComponents/AdminDashboard";
import AdminProfile from "./components/adminComponents/AdminProfile";
import AllGyms from "./components/adminComponents/AllGyms";
import AddGyms from "./components/adminComponents/AddGyms";
//owner routes
import OwnerLayout from "./layouts/ownerLayout/OwnerLayout";
import OwnerDashboard from "./components/ownerComponents/OwnerDashboard";
import AllMembers from "./components/ownerComponents/AllMembers";
import AddSelectionContainer from "./layouts/ownerLayout/AddSelectionContainer";
import Sales from "./components/ownerComponents/Sales";
import OwnerProfile from "./components/ownerComponents/OwnerProfile";
//trainer routes
import TrainerLayout from "./layouts/trainerLayout/TrainerLayout";
import TrainerProfile from "./components/trainerComponents/TrainerProfile";

// True once the user has installed the PWA (Add to Home Screen / Install
// app) and is opening it from that icon, NOT just browsing the site in a
// normal browser tab. Two ways browsers report this:
//   - `display-mode: standalone` media query — Android Chrome, desktop
//     Chrome/Edge, and modern iOS Safari all support this.
//   - `navigator.standalone` — older iOS Safari flag, kept as a fallback
//     since some iOS versions only expose this one.
const isStandalonePWA = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator?.standalone === true);

function App() {
  const dispatch = useDispatch();

  // Re-hydrate user authentication token from local storage on browser refresh
  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  // Live member/enquiry updates across devices + owner<->trainer —
  // connects once authenticated, disconnects on logout (see the hook).
  useRealtimeSync();

  return (
    <BrowserRouter>
      <BackButtonHandler />
      <Routes>
        {/* Public Path */}
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            // Installed users (native Capacitor app OR an installed PWA
            // opened from its home-screen icon) want to log in
            // immediately — the marketing homepage with its "Download
            // App" button is only useful for someone browsing the site
            // in a normal browser tab who hasn't installed anything yet.
            Capacitor.isNativePlatform() || isStandalonePWA() ? (
              <Login />
            ) : (
              <Home />
            )
          }
        />

        {/* 🔒 Nested Admin Routing Layer */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            {/* Automatically loads at "/admin" */}
            <Route index element={<AdminDashboard />} />
            <Route path="/admin/all-gyms" element={<AllGyms />} />
            <Route path="/admin/add-gyms" element={<AddGyms />} />
            <Route path="/admin/profile" element={<AdminProfile />} />
          </Route>
        </Route>

        {/* Owner */}
        <Route element={<ProtectedRoute allowedRoles={["owner"]} />}>
          <Route path="/owner" element={<OwnerLayout />}>
            <Route index element={<OwnerDashboard />} />
            <Route path="/owner/all-members" element={<AllMembers />} />
            <Route path="/owner/add" element={<AddSelectionContainer />} />
            <Route path="/owner/sales" element={<Sales />} />
            <Route path="/owner/profile" element={<OwnerProfile />} />
          </Route>
        </Route>

        {/* Trainer — reuses OwnerDashboard, AllMembers, and AddSelectionContainer
            (same views owners get for the first three pages) plus its own
            TrainerProfile for the fourth. */}
        <Route element={<ProtectedRoute allowedRoles={["trainer"]} />}>
          <Route path="/trainer" element={<TrainerLayout />}>
            <Route index element={<OwnerDashboard />} />
            <Route path="/trainer/all-members" element={<AllMembers />} />
            <Route path="/trainer/add" element={<AddSelectionContainer />} />
            <Route path="/trainer/profile" element={<TrainerProfile />} />
          </Route>
        </Route>

        {/* Fallback Redirection */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;