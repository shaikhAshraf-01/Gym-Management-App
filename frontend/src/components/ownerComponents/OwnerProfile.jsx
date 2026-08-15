import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  BadgeCheck,
  Camera,
  Trash2,
  LogOut,
} from "lucide-react";

import { logout } from "../../redux/slices/authSlice";
import {
  fetchOwnerProfile,
  uploadGymLogo,
  removeGymLogo,
  clearUploadError,
} from "../../redux/slices/ownerSlice";

export default function OwnerProfile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const photoInputRef = useRef(null);

  const { owner, gym, currentSubscription, loading, uploading, error, uploadError } =
    useSelector((state) => state.owner);

  // Only fetch when the profile hasn't been loaded yet — previously
  // this re-ran on every mount, causing the page to reload every time
  // the owner navigated back to it even though nothing had changed.
  useEffect(() => {
    if (!gym || !owner) {
      dispatch(fetchOwnerProfile());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };
  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("gymLogo", file);

    try {
      await dispatch(uploadGymLogo(formData)).unwrap();
    } catch (err) {
      // uploadError banner (below) already shows this — no need for
      // a blocking alert() as well.
    }

    e.target.value = "";
  };
  const handleRemoveLogo = async () => {
    try {
      await dispatch(removeGymLogo()).unwrap();
    } catch (error) {
      // uploadError banner (below) already shows this.
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error && (!gym || !owner)) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <p className="text-red-500 font-medium">{error}</p>
      </div>
    );
  }

  if (!gym || !owner) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <p className="text-gray-500">Gym profile data could not be found.</p>
      </div>
    );
  }

  const logo = gym?.gymLogo || "";
  const subscription = currentSubscription || {};

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      <div className="max-w-xl mx-auto">
        {/* ===================== UPLOAD ERROR BANNER ===================== */}
        {uploadError && (
          <div className="mb-4 flex items-start justify-between gap-3 bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-sm text-red-600 font-medium">{uploadError}</p>
            <button
              onClick={() => dispatch(clearUploadError())}
              className="text-red-400 hover:text-red-600 text-xs font-bold shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ===================== LOGO ===================== */}

        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-white border shadow-md overflow-hidden flex items-center justify-center">
              {logo ? (
                <img
                  src={logo}
                  alt={gym.gymName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 className="w-12 h-12 text-gray-400" />
              )}
            </div>

            <button
              disabled={uploading}
              onClick={() => photoInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-lg"
            >
              {uploading ? "Uploading ..." : <Camera size={16} />}
            </button>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />
          </div>

          {logo && (
            <button
              disabled={uploading}
              onClick={handleRemoveLogo}
              className="mt-2 flex items-center gap-1 text-red-500 text-sm"
            >
              {uploading ? (
                <>Removing...</>
              ) : (
                <>
                  <Trash2 size={14} />
                  Remove Logo
                </>
              )}
            </button>
          )}

          <h1 className="text-2xl font-bold mt-4">{gym.gymName}</h1>

          <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
            <Building2 size={14} />
            {gym.gymCode}
          </p>
        </div>
        {/* ===================== OWNER DETAILS ===================== */}

        <div className="bg-white rounded-xl shadow-sm border mt-8 p-5">
          <h2 className="text-sm font-bold text-gray-500 uppercase mb-5">
            Owner Details
          </h2>

          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <User size={18} className="text-blue-600" />
              <div>
                <p className="text-xs text-gray-400">Owner Name</p>
                <p className="font-semibold">{owner.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone size={18} className="text-blue-600" />
              <div>
                <p className="text-xs text-gray-400">Mobile Number</p>
                <p className="font-semibold">{owner.mobile}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail size={18} className="text-blue-600" />
              <div>
                <p className="text-xs text-gray-400">Email Address</p>
                <p className="font-semibold break-all">{owner.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ===================== GYM DETAILS ===================== */}

        <div className="bg-white rounded-xl shadow-sm border mt-6 p-5">
          <h2 className="text-sm font-bold text-gray-500 uppercase mb-5">
            Gym Details
          </h2>

          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-blue-600" />
              <div>
                <p className="text-xs text-gray-400">Location</p>
                <p className="font-semibold">{gym.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Building2 size={18} className="text-blue-600" />
              <div>
                <p className="text-xs text-gray-400">Gym Code</p>
                <p className="font-semibold">{gym.gymCode}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <BadgeCheck size={18} className="text-green-600" />
              <div>
                <p className="text-xs text-gray-400">Gym Status</p>

                <span
                  className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                    gym.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {gym.status}
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* ===================== SUBSCRIPTION DETAILS ===================== */}

        <div className="bg-white rounded-xl shadow-sm border mt-6 p-5">
          <h2 className="text-sm font-bold text-gray-500 uppercase mb-5">
            Subscription Details
          </h2>

          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <BadgeCheck size={18} className="text-green-600" />
              <div>
                <p className="text-xs text-gray-400">Current Plan</p>
                <p className="font-semibold">
                  {subscription.subscriptionPlan || "No Active Plan"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CalendarDays size={18} className="text-blue-600" />
              <div>
                <p className="text-xs text-gray-400">Start Date</p>
                <p className="font-semibold">
                  {subscription.startDate
                    ? new Date(subscription.startDate).toLocaleDateString()
                    : "--"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CalendarDays size={18} className="text-red-600" />
              <div>
                <p className="text-xs text-gray-400">Expiry Date</p>
                <p className="font-semibold">
                  {subscription.endDate
                    ? new Date(subscription.endDate).toLocaleDateString()
                    : "--"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ===================== LOGOUT ===================== */}

        <button
          onClick={handleLogout}
          className="mt-8 w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl py-3 font-semibold transition"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
}