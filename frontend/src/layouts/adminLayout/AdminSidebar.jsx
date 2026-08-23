import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { performLogout } from "../../redux/slices/authSlice";
import { LayoutDashboard, Dumbbell, User, LogOut } from "lucide-react";

export default function AdminSidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(performLogout());
    navigate("/login");
  };

  const navItems = [
    { label: "Dashboard", path: "/admin", icon: LayoutDashboard, end: true },
    { label: "All Gyms", path: "/admin/all-gyms", icon: Dumbbell, end: false },
    { label: "Add Gyms", path: "/admin/add-gyms", icon: Dumbbell, end: false },
    { label: "Profile", path: "/admin/profile", icon: User, end: false },
  ];

  return (
    <div className="w-full h-16 md:w-64 md:h-screen bg-slate-900 text-white fixed bottom-0 left-0 md:top-0 md:bottom-auto z-50 shadow-lg md:shadow-none flex md:flex-col items-center md:items-start justify-between p-2 md:p-5">
      
      {/* Sidebar Heading Panel Element (Hidden on mobile phones) */}
      <h2 className="text-xl font-bold mb-8 hidden md:block text-indigo-400 tracking-wide px-2">
        Admin Panel
      </h2>
      
      {/* Navigation Matrix Elements Layer */}
      <nav className="flex md:flex-col w-full gap-1 md:space-y-2 justify-around md:justify-start flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) => `
              flex flex-col md:flex-row items-center gap-1 md:gap-3 md:w-full p-2 px-2 rounded-xl md:rounded-lg text-xs md:text-sm font-medium transition-all duration-200 select-none
              ${isActive 
                ? "text-indigo-400 md:bg-indigo-600 md:text-white shadow-sm" 
                : "text-slate-400 hover:text-white md:hover:bg-slate-800"
              }
            `}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Desktop Exlusive Logout Trigger Button (Hidden on Mobile viewports) */}
      <button
        onClick={handleLogout}
        className="hidden md:flex items-center gap-3 w-full p-2 px-3 mt-auto text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer focus:outline-none"
      >
        <LogOut className="h-5 w-5" />
        <span>Logout</span>
      </button>

    </div>
  );
}