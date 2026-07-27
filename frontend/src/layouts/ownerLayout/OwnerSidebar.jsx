import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../redux/slices/authSlice";
import { LayoutDashboard, Dumbbell, Plus, User, LogOut } from "lucide-react";

export default function OwnerSidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const navItems = [
    { label: "Expiring", path: "/owner", icon: LayoutDashboard, end: true },
    { label: "Members", path: "/owner/all-members", icon: Dumbbell, end: false },
    { label: "Add", path: "/admin/add", icon: Plus, end: false },
    { label: "Sales", path: "/admin/sales", icon: Dumbbell, end: false },
    { label: "Profile", path: "/admin/profile", icon: User, end: false },
  ];

  return (
    <>
      {/* ========================================================================= */}
      {/* 📱 MOBILE VIEW: Floating Top Center Layout                                */}
      {/* ========================================================================= */}
      {/* Dark stealth background bar */}
      <div className="block md:hidden w-full h-16 bg-slate-950 text-white fixed bottom-0 left-0 z-50 shadow-2xl p-2 border-t border-slate-900">
        <nav className="grid grid-cols-5 w-full h-full justify-items-center items-center">
          {navItems.map((item, index) => {
            const isCenterItem = index === 2;

            if (isCenterItem) {
              return (
                <div key={item.path} className="w-full h-full flex items-center justify-center relative">
                  <NavLink
                    to={item.path}
                    end={item.end}
                    className={({ isActive }) => `
                      flex flex-col items-center justify-center rounded-full text-xs transition-all duration-200 select-none
                      absolute top-0 -translate-y-1/2 h-14 w-14 shadow-lg shadow-lime-500/10 border-4 border-slate-950 flex-shrink-0
                      /* Active: Vivid Lime | Inactive: Dark Slate */
                      ${isActive 
                        ? "bg-lime-400 text-black font-bold" 
                        : "bg-slate-900 text-slate-300 hover:bg-lime-400 hover:text-black"
                      }
                    `}
                  >
                    <item.icon className="h-6 w-6 flex-shrink-0" />
                  </NavLink>
                </div>
              );
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) => `
                  flex flex-col items-center justify-center gap-1 w-full h-full p-2 rounded-xl text-[10px] sm:text-xs transition-all duration-200 select-none text-center
                  /* Active: Electric Lime text | Inactive: Muted Slate */
                  ${isActive 
                    ? "text-lime-400 font-bold" 
                    : "text-slate-400 hover:text-white"
                  }
                `}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate max-w-full">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* 💻 DESKTOP VIEW: Sidebar Layout                                           */}
      {/* ========================================================================= */}
      {/* Premium Dark Panel Layout */}
      <div className="hidden md:flex w-64 h-screen bg-slate-950 text-white fixed top-0 bottom-auto left-0 z-50 flex-col items-start justify-between p-5 border-r border-slate-900 shadow-2xl">
        {/* Title branding text styled in Electric Lime */}
        <h2 className="text-xl font-black mb-8 text-lime-400 tracking-wider uppercase px-2">
          Owner Panel
        </h2>

        <nav className="flex flex-col w-full space-y-2 justify-start flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `
                flex flex-row items-center gap-3 w-full p-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 select-none
                /* Active: High contrast lime background with subtle glow shadow */
                /* Inactive: Slate textures shifting to deep background gray on mouse over */
                ${isActive 
                  ? "text-black bg-lime-400 font-bold shadow-lg shadow-lime-500/20 hover:bg-lime-500" 
                  : "text-slate-400 hover:text-lime-400 hover:bg-slate-900"
                }
              `}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Tactical Dark Red Logout Option */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full p-2.5 px-4 mt-auto text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-xl transition-colors cursor-pointer focus:outline-none"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </>
  );
}
