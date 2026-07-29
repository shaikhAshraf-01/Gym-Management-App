import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Path */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 🔒 Nested Admin Routing Layer */}
        <Route path="/admin" element={<AdminLayout />}>
          {/* Automatically loads at "/admin" */}
          <Route index element={<AdminDashboard />} />
          <Route path="/admin/all-gyms" element={<AllGyms />} />
          <Route path="/admin/add-gyms" element={<AddGyms />} />
          <Route path="/admin/profile" element={<AdminProfile />} />
        </Route>

        {/* Owner */}
        <Route path="/owner" element={<OwnerLayout />}>
          <Route index element={<OwnerDashboard />} />
          <Route path="/owner/all-members" element={<AllMembers />} />
          <Route path="/owner/add" element={<AddSelectionContainer />} />
          <Route path="/owner/sales" element={<Sales />} />
          <Route path="/owner/profile" element={<OwnerProfile />} />
        </Route>

        {/* Trainer — reuses OwnerDashboard, AllMembers, and AddSelectionContainer
            (same views owners get for the first three pages) plus its own
            TrainerProfile for the fourth. */}
        <Route path="/trainer" element={<TrainerLayout />}>
          <Route index element={<OwnerDashboard />} />
          <Route path="/trainer/all-members" element={<AllMembers />} />
          <Route path="/trainer/add" element={<AddSelectionContainer />} />
          <Route path="/trainer/profile" element={<TrainerProfile />} />
        </Route>

        {/* Fallback Redirection */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;