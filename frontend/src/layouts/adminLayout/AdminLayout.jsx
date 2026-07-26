import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar"; // 👈 Importing from your separate components folder

export default function AdminLayout() {
  return (
    <div className="flex flex-col md:flex-row bg-slate-50 min-h-screen">
      {/* Render the separated responsive navigation node */}
      <AdminSidebar />
      
      {/* Main viewport application view wrapper layout bounding zone */}
      <div className="flex-1 p-5 sm:p-3 pb-24 md:pb-8 md:ml-64">
        <Outlet />
      </div>
    </div>
  );
}
