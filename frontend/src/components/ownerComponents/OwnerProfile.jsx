import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { 
  Building2, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Users, 
  LogOut, 
  Plus, 
  Trash2
} from "lucide-react";
import { removeTrainer } from "../../redux/slices/gymSlice";
import AddTrainerModal from "./AddTrainerModal";

export default function OwnerProfile() {
  const dispatch = useDispatch();
  const activeGymId = "GYM-101"; 
  
  // Connect cleanly to the Redux store gyms list slice
  const gym = useSelector((state) => 
    state.gyms.gyms.find((g) => g.id === activeGymId)
  );

  // Manage modal open state
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!gym) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-500 text-sm font-medium">
        Gym profile data could not be found.
      </div>
    );
  }

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      console.log("Session cleared");
    }
  };

  const handleDeleteTrainer = (trainerId, trainerName) => {
    if (window.confirm(`Are you sure you want to remove trainer "${trainerName}"?`)) {
      dispatch(removeTrainer({ gymId: gym.id, trainerId }));
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto bg-gray-50 min-h-screen pb-16 text-gray-900 relative">
      
      {/* HEADER BAR PANEL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 pb-4 mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
            {gym.name}
          </h1>
          <p className="text-gray-500 text-xs md:text-sm mt-1 flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-gray-400" /> ID: {gym.id}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
            gym.status === "active" 
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
              : "bg-red-50 text-red-600 border border-red-200"
          }`}>
            {gym.status === "active" ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Active Account
              </>
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5 text-red-500" />
                Suspended
              </>
            )}
          </span>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-red-50 text-red-600 hover:bg-red-100 transition px-3 py-1.5 rounded-lg text-xs font-bold border border-red-200 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </div>

      {/* CORE WORKSPACE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LEFT INFRASTRUCTURE BLOCK */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 mb-4">
              <User className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Owner Identity</h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 font-medium">Full Name</p>
                <p className="text-sm font-semibold text-gray-900">{gym.ownerName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Contact Mobile
                </p>
                <p className="text-sm font-semibold text-gray-900">{gym.ownerMobile}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Registered Email
                </p>
                <p className="text-sm font-semibold text-gray-900">{gym.email || "No email linked"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 mb-4">
              <MapPin className="h-5 w-5 text-gray-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Location</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">{gym.address}</p>
          </div>
        </div>

        {/* RIGHT MANAGEMENT BLOCK */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Users className="h-5 w-5 text-violet-600" />
                <h3 className="text-base font-bold text-gray-900">Manage Trainers Team</h3>
                <span className="bg-violet-50 text-violet-700 text-xs font-bold px-2 py-0.5 rounded-full border border-violet-100">
                  {gym.trainers.length} Total
                </span>
              </div>

              {/* The button is completely safe now, decoupled from trainer variables */}
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-2 rounded-lg transition-all shadow-sm cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add New Trainer
              </button>
            </div>

            <div className="space-y-3">
              {gym.trainers.length === 0 ? (
                <p className="text-xs text-gray-400 py-8 text-center border border-dashed border-gray-200 rounded-xl">
                  No trainers registered to this branch yet.
                </p>
              ) : (
                gym.trainers.map((tItem) => (
                  <div 
                    key={tItem.id} 
                    className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:border-gray-300 transition-all shadow-2xs"
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-900">{tItem.name}</p>
                      <p className="text-xs text-gray-500 font-medium mt-0.5 flex items-center gap-1">
                        <Phone className="h-3 w-3 text-gray-400" /> {tItem.mobile}
                      </p>
                      <span className="inline-block text-[10px] text-gray-400 font-mono tracking-tight mt-1.5 bg-white px-2 py-0.5 border border-gray-100 rounded">
                        ID: {tItem.id}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteTrainer(tItem.id, tItem.name)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-all cursor-pointer"
                      title="Remove Trainer Record"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ISOLATED MODAL PORTAL LINKED VIA PROPS */}
      <AddTrainerModal 
        gymId={gym.id}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

    </div>
  );
}
