import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, role, loading, isInitialized  } = useSelector((state) => state.auth);

   if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }
  // If session recovery is loading, you can return a spinner or null
  if (loading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  // If not authenticated, kick back to login layout
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If role is authenticated but unauthorized for this path branch, block it
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Proactively guide them back to their own default dashboard entrypoint
    return <Navigate to={`/${role}`} replace />;
  }

  // If it passes all security gates, render the child sub-components
  return <Outlet />;
}
