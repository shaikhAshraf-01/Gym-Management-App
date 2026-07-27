import React from "react";
import { Outlet } from "react-router-dom";
import OwnerSidebar from "./OwnerSidebar"; // 👈 Importing from your separate components folder

export default function OwnerLayout() {
  return (
    <div className="flex flex-col md:flex-row bg-gray-200 min-h-screen">
      {/* Render the separated responsive navigation node */}
      <OwnerSidebar />
      
      {/* Main viewport application view wrapper layout bounding zone */}
      <div className="flex-1  pb-24 md:pb-8 md:ml-64">
        <Outlet />
      </div>
    </div>
  );
}
