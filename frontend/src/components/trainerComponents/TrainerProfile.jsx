import React, { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { User, Phone, Mail, Building2, LogOut, Camera, Trash2 } from "lucide-react";

import { performLogout } from "../../redux/slices/authSlice";
import {
  fetchOwnerProfile,
  uploadTrainerPhoto,
  removeTrainerPhoto,
  clearUploadError,
} from "../../redux/slices/ownerSlice";

export default function TrainerProfile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const photoInputRef = useRef(null);

  // Same backend endpoint + slice OwnerProfile.jsx uses — the "owner"
  // key here actually holds whoever is logged in (trainer, in this
  // case), see ownerController's updated getOwnerProfile.
  const { owner: trainer, gym, loading, uploading, error, uploadError } = useSelector((state) => state.owner);

  // Only fetch when the profile hasn't been loaded yet — previously
  // this re-ran on every mount, reloading the page every time the
  // trainer navigated back to it even though nothing had changed.
  useEffect(() => {
    if (!trainer || !gym) {
      dispatch(fetchOwnerProfile());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(performLogout());
    navigate("/login");
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("photo", file);

    try {
      await dispatch(uploadTrainerPhoto(formData)).unwrap();
    } catch (err) {
      // uploadError banner (below) already shows this.
    }

    e.target.value = "";
  };

  const handleRemovePhoto = async () => {
    try {
      await dispatch(removeTrainerPhoto()).unwrap();
    } catch (err) {
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

  if (error && (!trainer || !gym)) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <p className="text-red-500 font-medium">{error}</p>
      </div>
    );
  }

  if (!trainer || !gym) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-500 text-sm font-medium">
        Trainer profile data could not be found.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto bg-gray-50 min-h-screen pb-16">

      {/* Upload error banner — non-blocking */}
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

      {/* Header — photo upload */}
      <div className="flex flex-col items-center text-center border-b border-gray-200 pb-6 mb-6">

        <div className="relative">
          <div className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
            {trainer.photo ? (
              <img
                src={trainer.photo}
                alt={trainer.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="h-10 w-10 md:h-12 md:w-12 text-gray-400" />
            )}
          </div>

          <button
            disabled={uploading}
            onClick={() => photoInputRef.current?.click()}
            className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-lg cursor-pointer"
          >
            {uploading ? "..." : <Camera size={14} />}
          </button>

          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>

        {trainer.photo && (
          <button
            disabled={uploading}
            onClick={handleRemovePhoto}
            className="mt-2 flex items-center gap-1 text-red-500 text-sm cursor-pointer"
          >
            {uploading ? (
              <>Removing...</>
            ) : (
              <>
                <Trash2 size={14} />
                Remove Photo
              </>
            )}
          </button>
        )}

        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mt-3">
          {trainer.name}
        </h1>

        <p className="text-gray-500 text-sm mt-1">
          Trainer at {gym.gymName}
        </p>

      </div>

      {/* Trainer Details */}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-5">

        <div>
          <p className="text-xs text-gray-400">
            Name
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {trainer.name}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Phone className="h-3 w-3" />
            Mobile Number
          </p>

          <p className="text-sm font-semibold text-gray-900">
            {trainer.mobile}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Mail className="h-3 w-3" />
            Email
          </p>

          <p className="text-sm font-semibold text-gray-900">
            {trainer.email}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            Gym
          </p>

          <p className="text-sm font-semibold text-gray-900">
            {gym.gymName} ({gym.gymCode})
          </p>
        </div>

      </div>

      {/* Logout */}

      <div className="mt-8">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 transition px-4 py-3 rounded-xl text-sm font-bold border border-red-200 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>

    </div>
  );
}