import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import AdminLayout from "./layouts/adminLayout/AdminLayout";
import AdminDashboard from "./components/adminComponents/AdminDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Path */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 🔒 Nested Admin Routing Layer */}
        <Route path="/admin-dashboard" element={<AdminLayout />}>
          {/* index means this sub-route loads automatically at "/admin-dashboard" */}
          <Route index element={<AdminDashboard />} />
          
          {/* Example of adding more sub-pages under the layout later:
          <Route path="users" element={<AdminUsers />} /> */}
        </Route>

        {/* Fallback Redirection */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
