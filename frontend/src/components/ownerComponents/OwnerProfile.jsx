import React, { useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Users,
  LogOut,
  Camera,
} from "lucide-react";
import { logout } from "../../redux/slices/authSlice";

export default function OwnerProfile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // TODO: Replace this with the logged-in owner's gym ID later.
  const activeGymId = "GYM-101";
  
  const gym = useSelector((state) =>
    state.gyms.gyms.find(
      (g) => g._id === activeGymId || g.gymCode === activeGymId || g.id === activeGymId
    )
  );

  // Local state to track frontend-only image preview
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const photoInputRef = useRef(null);

  if (!gym) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-500 text-sm font-medium">
        Gym profile data could not be found.
      </div>
    );
  }

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please choose an image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewPhoto(reader.result); // Updates state to trigger visual re-render
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const owner = gym.owner || {};
  // Prioritise preview photo over saved gym photo
  const currentPhoto = previewPhoto || gym.ownerPhoto; 

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto bg-gray-50 min-h-screen pb-16 text-gray-900">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col items-center text-center border-b border-gray-200 pb-6 mb-6">
        <div className="relative shrink-0 mb-3">
          <div className="h-20 w-20 md:h-24 md:w-24 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-sm flex items-center justify-center">
            {currentPhoto ? (
              <img
                src={currentPhoto}
                alt={owner.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-10 w-10 md:h-12 md:w-12 text-gray-400" />
            )}
          </div>
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md border-2 border-white cursor-pointer"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          {gym.gymName}
        </h1>
        <p className="text-gray-500 text-xs md:text-sm mt-1 flex items-center gap-1">
          <Building2 className="h-4 w-4" /> {gym.gymCode}
        </p>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LEFT COLUMN (1/3 Width) */}
        <div className="space-y-6">
          {/* Owner Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 mb-4">
              <User className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                Owner Details
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 font-medium">Full Name</p>
                <p className="text-sm font-semibold text-gray-900">{owner.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Mobile
                </p>
                <p className="text-sm font-semibold text-gray-900">{owner.mobile}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email
                </p>
                <p className="text-sm font-semibold text-gray-900 break-all">
                  {owner.email}
                </p>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 mb-4">
              <MapPin className="h-5 w-5 text-gray-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                Address
              </h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {gym.address || gym.location || "No address available"}
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN (2/3 Width) */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2.5 pb-2">
            <Users className="h-5 w-5 text-gray-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
              Gym Trainers ({gym.trainers?.length || 0})
            </h3>
          </div>

          {!gym.trainers || gym.trainers.length === 0 ? (
            <div className="border border-dashed border-gray-200 bg-white rounded-xl py-12 text-center">
              <p className="text-sm text-gray-400">No trainers assigned to this gym.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {gym.trainers.map((trainer) => (
                <div
                  key={trainer.id || trainer._id}
                  className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 space-y-2"
                >
                  <div>
                    <p className="text-xs text-gray-400">Trainer Name</p>
                    <p className="text-sm font-semibold text-gray-900">{trainer.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Mobile
                    </p>
                    <p className="text-sm text-gray-700">{trainer.mobile}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Mail className="h-3 w-3" /> Email
                    </p>
                    <p className="text-sm text-gray-700 break-all">{trainer.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Logout Button */}
      <div className="mt-8">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 transition px-4 py-3 rounded-xl text-sm font-bold border border-red-200 cursor-pointer"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </div>
  );
}
