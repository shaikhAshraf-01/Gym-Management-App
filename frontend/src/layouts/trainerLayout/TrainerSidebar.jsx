import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Dumbbell, Plus, User, FileText, CreditCard, X } from "lucide-react";

export default function TrainerSidebar() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", path: "/trainer", icon: LayoutDashboard, end: true },
    { label: "Members", path: "/trainer/all-members", icon: Dumbbell, end: false },
    { label: "Add", path: "/trainer/add", icon: Plus, end: false, isAction: true },
    { label: "Profile", path: "/trainer/profile", icon: User, end: false },
  ];

  return (
    <>
      {/* ========================================================================= */}
      {/* 📱 MOBILE VIEW */}
      {/* ========================================================================= */}
      {isMobileMenuOpen && (
        <div className="block md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity">
          <div className="absolute bottom-16 left-0 right-0 bg-slate-950 border-t border-slate-900 rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Create New Entry</h3>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => { 
                  setIsMobileMenuOpen(false); 
                  navigate("/trainer/add", { state: { type: "membership" } }); 
                }}
                className="flex items-center gap-4 w-full p-4 bg-slate-900 border border-slate-800 rounded-2xl text-left text-white hover:border-lime-400/50 transition-all cursor-pointer"
              >
                <div className="p-3 bg-lime-400/10 rounded-xl text-lime-400"><CreditCard className="h-6 w-6" /></div>
                <div>
                  <p className="font-bold text-sm">Add Membership</p>
                  <p className="text-xs text-slate-400">Register a new client membership</p>
                </div>
              </button>

              <button
                onClick={() => { 
                  setIsMobileMenuOpen(false); 
                  navigate("/trainer/add", { state: { type: "enquiry" } }); 
                }}
                className="flex items-center gap-4 w-full p-4 bg-slate-900 border border-slate-800 rounded-2xl text-left text-white hover:border-lime-400/50 transition-all cursor-pointer"
              >
                <div className="p-3 bg-lime-400/10 rounded-xl text-lime-400"><FileText className="h-6 w-6" /></div>
                <div>
                  <p className="font-bold text-sm">Add Enquiry</p>
                  <p className="text-xs text-slate-400">Log a new lead or question</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav Bar — all 4 items sit evenly in one row now, no raised
          center button, since 4 items already align cleanly on their own. */}
      <div className="block md:hidden w-full h-16 bg-slate-950 text-white fixed bottom-0 left-0 z-50 shadow-2xl p-2 border-t border-slate-900">
        <nav className="grid grid-cols-4 w-full h-full justify-items-center items-center">
          {navItems.map((item) => {
            if (item.isAction) {
              return (
                <button
                  key={item.path}
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className={`flex flex-col items-center justify-center gap-1 w-full h-full p-2 rounded-xl text-[10px] sm:text-xs transition-all duration-200 select-none text-center cursor-pointer ${
                    isMobileMenuOpen ? "text-lime-400 font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="truncate max-w-full">{item.label}</span>
                </button>
              );
            }
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) => `flex flex-col items-center justify-center gap-1 w-full h-full p-2 rounded-xl text-[10px] sm:text-xs transition-all duration-200 select-none text-center ${
                  isActive ? "text-lime-400 font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate max-w-full">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* 💻 DESKTOP VIEW */}
      {/* ========================================================================= */}
      <div className="hidden md:flex w-64 h-screen bg-slate-950 text-white fixed top-0 bottom-0 left-0 z-50 flex-col justify-between p-5 border-r border-slate-900 shadow-2xl">
        <div className="flex flex-col w-full flex-1">
          <h2 className="text-xl font-black mb-8 text-lime-400 tracking-wider uppercase px-2">Trainer Panel</h2>
          <nav className="flex flex-col w-full space-y-2">
            {navItems.map((item, idx) => {
              if (item.isAction) {
                return (
                  <NavLink
                    key={idx}
                    to={item.path}
                    className={({ isActive }) => `flex flex-row items-center gap-3 w-full p-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 select-none cursor-pointer ${
                      isActive ? "text-black bg-lime-400 font-bold" : "text-slate-400 hover:text-lime-400 hover:bg-slate-900"
                    }`}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              }
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) => `flex flex-row items-center gap-3 w-full p-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 select-none cursor-pointer ${
                    isActive ? "text-black bg-lime-400 font-bold shadow-lg shadow-lime-500/20 hover:bg-lime-500" : "text-slate-400 hover:text-lime-400 hover:bg-slate-900"
                  }`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
        {/* No logout button here — lives in TrainerProfile instead, one canonical place */}
      </div>
    </>
  );
}