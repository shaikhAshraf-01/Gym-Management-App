import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  User,
  Phone,
  Mail,
  LogOut,
} from "lucide-react";

import { logout } from "../../redux/slices/authSlice";
export default function TrainerProfile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const activeGymId = "GYM-101";
  const activeTrainerId = "TRN-1";

  const gym = useSelector((state) =>
    state.gyms.gyms.find((g) => g.id === activeGymId)
  );

  const trainer = gym?.trainers.find(
    (t) => t.id === activeTrainerId
  );

  if (!gym || !trainer) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-500 text-sm font-medium">
        Trainer profile data could not be found.
      </div>
    );
  }

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };
  return (
  <div className="p-4 md:p-6 max-w-2xl mx-auto bg-gray-50 min-h-screen pb-16">

    {/* Header */}
    <div className="flex flex-col items-center text-center border-b border-gray-200 pb-6 mb-6">

      <div className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-gray-200 border-2 border-white shadow-sm flex items-center justify-center">
        <User className="h-10 w-10 md:h-12 md:w-12 text-gray-400" />
      </div>

      <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mt-3">
        {trainer.name}
      </h1>

      <p className="text-gray-500 text-sm mt-1">
        Trainer at {gym.name}
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