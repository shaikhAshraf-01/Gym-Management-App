import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../../redux/slices/authSlice";
import { User, Phone, Mail, Shield, Lock, Eye, EyeOff, LogOut, KeyRound } from "lucide-react";

export default function AdminProfile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // 1. Local states to manage "Change Password" toggles and visibility
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 2. Fetch logged-in mobile number from your global Redux store
  const { user } = useSelector((state) => state.auth);
  const mobileNumber = user?.mobile || "9876543210"; // Fallback placeholder if store is empty

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const handlePasswordChangeSubmit = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    // API logic to update password would execute here
    alert("Password updated successfully!");
    setIsChangingPassword(false);
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* CARD 1: MAIN PROFILE HEADER & CORE DATA */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          {/* Avatar Icon */}
          <div className="h-20 w-20 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner shrink-0">
            <User className="h-10 w-10" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800">Master Administrator</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage and monitor global application operations</p>
          </div>
          {/* Access Badge */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-semibold uppercase tracking-wider">
            <Shield className="h-3.5 w-3.5" />
            Super Admin
          </span>
        </div>

        {/* PROFILE FIELDS MATRIX */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-100">
          {/* Mobile Field */}
          <div className="p-4 bg-slate-50 rounded-xl flex items-center gap-3">
            <Phone className="h-5 w-5 text-slate-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Mobile Number</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">+91 {mobileNumber}</p>
            </div>
          </div>

          {/* Suggested Field: Email (Required for automated report alerts) */}
          <div className="p-4 bg-slate-50 rounded-xl flex items-center gap-3">
            <Mail className="h-5 w-5 text-slate-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Email Address</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">admin@gymmanagement.com</p>
            </div>
          </div>

          {/* Password Visual Row Field */}
          <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between gap-3 col-span-1 sm:col-span-2">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-slate-400 shrink-0" />
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Account Password</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5 tracking-widest">
                  {showPassword ? "admin12345" : "••••••••••••"}
                </p>
              </div>
            </div>
            {/* View/Hide text character content string toggle button */}
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors focus:outline-none"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* INTERACTIVE TOGGLE: TRIGGER CHANGE PASSWORD SLIDE-FRAME */}
        {!isChangingPassword && (
          <button
            type="button"
            onClick={() => setIsChangingPassword(true)}
            className="mt-6 flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors focus:outline-none cursor-pointer"
          >
            <KeyRound className="h-4 w-4" />
            <span>Change Security Password?</span>
          </button>
        )}
      </div>

      {/* CARD 2: DYNAMIC CHANGE PASSWORD ACTION DRAWER PANEL */}
      {isChangingPassword && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-fadeIn">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <KeyRound className="text-indigo-500 h-5 w-5" />
            Update Security Password
          </h2>
          <form onSubmit={handlePasswordChangeSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1.5 block w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Confirm New Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1.5 block w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => { setIsChangingPassword(false); setNewPassword(""); setConfirmPassword(""); }}
                className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Save Password
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 📱 MOBILE EXCLUSIVE LOGOUT ACTION BUTTON BANNER */}
      <div className="block md:hidden">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm rounded-2xl border border-red-200 shadow-sm transition-colors cursor-pointer focus:outline-none"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out of Admin Account</span>
        </button>
      </div>

    </div>
  );
}
