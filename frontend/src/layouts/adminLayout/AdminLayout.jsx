import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar"; // 👈 Importing from your separate components folder

export default function AdminLayout() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-50 md:flex-row">
      {/* Render the separated responsive navigation node */}
      <AdminSidebar />
      
      {/* Main viewport application view wrapper layout bounding zone */}
      <div className="min-h-[100dvh] min-w-0 flex-1 p-5 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:p-3 md:ml-64 md:pb-8">
        <Outlet />
      </div>
    </div>
  );
}
