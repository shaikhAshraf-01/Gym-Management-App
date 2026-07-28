import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Users, X, Lock } from "lucide-react";
import { addTrainer } from "../../redux/slices/gymSlice";

export default function AddTrainerModal({ gymId, isOpen, onClose }) {
  const dispatch = useDispatch();

  // Keep internal states isolated so typing doesn't lag the main dashboard layout
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !mobile || !password) return;

    const newTrainerObj = {
      id: `TRN-${Date.now()}`, 
      name,
      mobile,
      password,
    };

    // Dispatch the payload correctly to match gymSlice requirements
    dispatch(addTrainer({ gymId, trainer: newTrainerObj }));

    // Reset local data fields and exit modal overlay safely
    setName("");
    setMobile("");
    setPassword("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-sm w-full overflow-hidden animate-fadeIn">
        
        {/* TOP MODAL CONTROL BAR */}
        <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" /> Onboard New Trainer
          </h3>
          <button 
            type="button"
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 rounded-md p-0.5 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* SECURE ONBOARDING DATA FORM */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
              Trainer Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
              Mobile Number
            </label>
            <input
              type="tel"
              required
              maxLength="10"
              placeholder="10-digit mobile number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 flex items-center gap-1">
              <Lock className="h-3 w-3" /> Initial Password
            </label>
            <input
              type="password"
              required
              placeholder="Set login password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
            <p className="text-[10px] text-gray-400 mt-1 italic leading-tight">
              The trainer will change this temporary password during their first app login.
            </p>
          </div>

          {/* ACTION BUTTON FOOTER */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-2.5 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-lg transition shadow-sm cursor-pointer"
            >
              Save Trainer
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
