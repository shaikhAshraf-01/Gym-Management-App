import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { restoreSession } from "./redux/slices/authSlice";

// Security Gate Wrapper
import ProtectedRoute from "./pages/protectedRoute"; // Adjust this path to match your folder structural layout

// Public View
import Login from "./pages/Login";

// Admin Views
import AdminLayout from "./layouts/adminLayout/AdminLayout";
import AdminDashboard from "./components/adminComponents/AdminDashboard";
import AdminProfile from "./components/adminComponents/AdminProfile";
import AllGyms from "./components/adminComponents/AllGyms";
import AddGyms from "./components/adminComponents/AddGyms";

// Owner Views
import OwnerLayout from "./layouts/ownerLayout/OwnerLayout";
import OwnerDashboard from "./components/ownerComponents/OwnerDashboard";
import AllMembers from "./components/ownerComponents/AllMembers";
import AddSelectionContainer from "./layouts/ownerLayout/AddSelectionContainer";
import Sales from "./components/ownerComponents/Sales";
import OwnerProfile from "./components/ownerComponents/OwnerProfile";

// Trainer Views
import TrainerLayout from "./layouts/trainerLayout/TrainerLayout";
import TrainerProfile from "./components/trainerComponents/TrainerProfile";

function App() {
  const dispatch = useDispatch();

  // Run immediately on page boost to handle page refreshments
  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        {/* ==========================================
            ========== PUBLIC DISPATCH ROUTES =========
            ========================================== */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ==========================================
            ========= 🔒 SECURED ADMIN PATHS =========
            ========================================== */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            {/* Note: Fixed relative nested naming sub-paths */}
            <Route path="all-gyms" element={<AllGyms />} />
            <Route path="add-gyms" element={<AddGyms />} />
            <Route path="profile" element={<AdminProfile />} />
          </Route>
        </Route>

        {/* ==========================================
            ========= 🔒 SECURED OWNER PATHS =========
            ========================================== */}
        <Route element={<ProtectedRoute allowedRoles={["owner"]} />}>
          <Route path="/owner" element={<OwnerLayout />}>
            <Route index element={<OwnerDashboard />} />
            <Route path="all-members" element={<AllMembers />} />
            <Route path="add" element={<AddSelectionContainer />} />
            <Route path="sales" element={<Sales />} />
            <Route path="profile" element={<OwnerProfile />} />
          </Route>
        </Route>

        {/* ==========================================
            ========= 🔒 SECURED TRAINER PATHS =======
            ========================================== */}
        <Route element={<ProtectedRoute allowedRoles={["trainer"]} />}>
          <Route path="/trainer" element={<TrainerLayout />}>
            <Route index element={<OwnerDashboard />} />
            <Route path="all-members" element={<AllMembers />} />
            <Route path="add" element={<AddSelectionContainer />} />
            <Route path="profile" element={<TrainerProfile />} />
          </Route>
        </Route>

        {/* ==========================================
            =========== FALLBACK NAVIGATION ===========
            ========================================== */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
