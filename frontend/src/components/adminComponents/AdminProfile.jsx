import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../../redux/slices/authSlice";
import { User, Phone, Mail, Shield, LogOut, KeyRound } from "lucide-react";

export default function AdminProfile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Real logged-in admin data
  const { user } = useSelector((state) => state.auth);
  const adminName = user?.name || "";
  const adminMobile = user?.mobile || "";
  const adminEmail = user?.email || "";

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setFormError("");
  };

  const handleCancel = () => {
    setIsChangingPassword(false);
    resetForm();
  };

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (newPassword !== confirmPassword) {
      setFormError("New password and confirmation do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setFormError("New password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    // TODO: wire to a real changePassword thunk once
    // PATCH /api/admin/change-password (or similar) exists on the backend.
    // For now this is UI-only — fields are validated and ready to dispatch.
    console.log("Ready to submit:", { currentPassword, newPassword });
    setSubmitting(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* CARD 1: MAIN PROFILE HEADER & CORE DATA */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="h-20 w-20 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner shrink-0">
            <User className="h-10 w-10" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800">{adminName}</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage and monitor global application operations</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-semibold uppercase tracking-wider">
            <Shield className="h-3.5 w-3.5" />
            Super Admin
          </span>
        </div>

        {/* PROFILE FIELDS — password display card removed entirely.
            It's hashed server-side, there's nothing to show. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-100">
          <div className="p-4 bg-slate-50 rounded-xl flex items-center gap-3">
            <Phone className="h-5 w-5 text-slate-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Mobile Number</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">+91 {adminMobile}</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl flex items-center gap-3">
            <Mail className="h-5 w-5 text-slate-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Email Address</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{adminEmail || "Not set"}</p>
            </div>
          </div>
        </div>

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

      {/* CARD 2: CHANGE PASSWORD FORM */}
      {isChangingPassword && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-fadeIn">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <KeyRound className="text-indigo-500 h-5 w-5" />
            Update Security Password
          </h2>

          <form onSubmit={handlePasswordChangeSubmit} className="space-y-4 mt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Current Password
              </label>
              <input
                type="password"
                required
                disabled={submitting}
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1.5 block w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors disabled:bg-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  disabled={submitting}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1.5 block w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  disabled={submitting}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1.5 block w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors disabled:bg-slate-100"
                />
              </div>
            </div>

            {formError && (
              <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {formError}
              </p>
            )}

            <div className="flex items-center gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={handleCancel}
                disabled={submitting}
                className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-60"
              >
                {submitting ? "Saving..." : "Save Password"}
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