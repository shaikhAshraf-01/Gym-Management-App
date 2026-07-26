import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import AdminLayout from "./layouts/adminLayout/AdminLayout";
import AdminDashboard from "./components/adminComponents/AdminDashboard";
import AdminProfile from "./components/adminComponents/AdminProfile";
import AllGyms from "./components/adminComponents/AllGyms";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Path */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 🔒 Nested Admin Routing Layer */}
      < Route path="/admin" element={<AdminLayout />}>
          {/* Automatically loads at "/admin" */}
          <Route index element={<AdminDashboard />} />
          
          {/* Resolves cleanly to "/admin/all-gyms" */}
          <Route path="/admin/all-gyms" element={<AllGyms />} />
          
          {/* Resolves cleanly to "/admin/profile" */}
          <Route path="/admin/profile" element={<AdminProfile />} />
        </Route>

        {/* Fallback Redirection */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
