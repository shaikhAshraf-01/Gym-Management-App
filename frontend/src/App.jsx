import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
// Admin routes
import AdminLayout from "./layouts/adminLayout/AdminLayout";
import AdminDashboard from "./components/adminComponents/AdminDashboard";
import AdminProfile from "./components/adminComponents/AdminProfile";
import AllGyms from "./components/adminComponents/AllGyms";
import AddGyms from "./components/adminComponents/AddGyms";
// Owner routes
import OwnerLayout from "./layouts/ownerLayout/OwnerLayout";
import OwnerDashboard from "./components/ownerComponents/OwnerDashboard";
import AllMembers from "./components/ownerComponents/AllMembers";
import AddSelectionContainer from "./layouts/ownerLayout/AddSelectionContainer";
import Sales from "./components/ownerComponents/Sales";
import OwnerProfile from "./components/ownerComponents/OwnerProfile";

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        {/* Public Path */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 🔒 Nested Admin Routing Layer */}
        <Route path="/admin" element={<AdminLayout />}>
          {/* Automatically loads at "/admin" */}
          <Route index element={<AdminDashboard />} />
          {/* Relative paths clean up sub-resource resolution */}
          <Route path="all-gyms" element={<AllGyms />} />
          <Route path="add-gyms" element={<AddGyms />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>

        {/* 🔒 Nested Owner Routing Layer */}
        <Route path="/owner" element={<OwnerLayout />}>
          {/* Automatically loads at "/owner" */}
          <Route index element={<OwnerDashboard />} />
          <Route path="all-members" element={<AllMembers />} />
          <Route path="add" element={<AddSelectionContainer />} />
          <Route path="sales" element={<Sales />} />
          <Route path="profile" element={<OwnerProfile />} />
        </Route>

        {/* Fallback Redirection */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
