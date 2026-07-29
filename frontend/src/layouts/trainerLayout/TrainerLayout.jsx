import React from "react";
import { Outlet } from "react-router-dom";
import TrainerSidebar from "./TrainerSidebar";

export default function TrainerLayout() {
  return (
    <div className="flex flex-col md:flex-row bg-gray-200 min-h-screen">
      <TrainerSidebar />

      <div className="flex-1 pb-24 md:pb-8 md:ml-64">
        <Outlet />
      </div>
    </div>
  );
}