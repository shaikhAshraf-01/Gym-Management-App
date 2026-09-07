import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Phone, Mail, Building2, LogOut, MapPin } from "lucide-react";

import { performLogout } from "../../redux/slices/authSlice";
import { fetchOwnerProfile } from "../../redux/slices/ownerSlice";

export default function TrainerProfile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Same backend endpoint + slice OwnerProfile.jsx uses — the "owner"
  // key here actually holds whoever is logged in (trainer, in this
  // case), see ownerController's updated getOwnerProfile.
  const { owner: trainer, gym, loading, error } = useSelector((state) => state.owner);

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
    navigate("/");
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
      <div className="min-h-screen bg-slate-950 px-4 pb-20 pt-5 text-slate-100 md:px-8">
      <div className="mx-auto max-w-2xl">
      <div className="flex flex-col items-center border-b border-slate-800 pb-6 text-center">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-xl">
            {gym.gymLogo ? (
              <img
                src={gym.gymLogo}
                alt={gym.gymName}
                className="h-full w-full object-cover"
              />
            ) : (
              <Building2 className="h-10 w-10 text-cyan-400" />
            )}
          </div>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">Trainer profile</p>
        <h1 className="mt-2 text-2xl font-extrabold text-white md:text-3xl">
          {trainer.name}
        </h1>
        <p className="mt-1 text-sm text-slate-400">{gym.gymName}</p>
      </div>
      <div className="mt-6 space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">

        <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">
            Trainer name
          </p>
          <p className="text-sm font-semibold text-slate-100">
            {trainer.name}
          </p>
        </div>

        <div>
          <p className="flex items-center gap-1 text-xs uppercase tracking-wider text-slate-500"><Phone className="h-3 w-3" />
            Mobile Number
          </p>

          <p className="text-sm font-semibold text-slate-100">
            {trainer.mobile}
          </p>
        </div>

        <div>
          <p className="flex items-center gap-1 text-xs uppercase tracking-wider text-slate-500">
            <Mail className="h-3 w-3" />
            Email
          </p>

          <p className="break-all text-sm font-semibold text-slate-100">
            {trainer.email}
          </p>
        </div>

        <div>
          <p className="flex items-center gap-1 text-xs uppercase tracking-wider text-slate-500">
            <Building2 className="h-3 w-3" />
            Gym
          </p>

          <p className="text-sm font-semibold text-slate-100">{gym.gymName} ({gym.gymCode})</p>
        </div>
        <div>
          <p className="flex items-center gap-1 text-xs uppercase tracking-wider text-slate-500"><MapPin className="h-3 w-3" /> Gym address</p>
          <p className="text-sm font-semibold text-slate-100">{gym.location}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Profile logo</p>
          <p className="text-xs text-slate-400">Managed by the gym owner and shared across this gym.</p>
        </div>

      </div>

      {/* Logout */}

      <div className="mt-8">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-900/60 bg-rose-950/40 px-4 py-3 text-sm font-bold text-rose-300 transition hover:bg-rose-950/70 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>

      </div>
    </div>
  );
}