import React, { useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { User, Phone, Camera, Edit2, Check, X, KeyRound, LogOut } from "lucide-react";
import { updateTrainerField, setTrainerPassword } from "../../redux/slices/gymSlice";
import { logout } from "../../redux/slices/authSlice";

export default function TrainerProfile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Mock identity, same pattern as OwnerProfile's activeGymId — swap for
  // auth.user once real login issues a gymId + trainerId.
  const activeGymId = "GYM-101";
  const activeTrainerId = "TRN-1";

  const gym = useSelector((state) => state.gyms.gyms.find((g) => g.id === activeGymId));
  const trainer = gym?.trainers.find((t) => t.id === activeTrainerId);

  const photoInputRef = useRef(null);

  // Inline edit state for name/mobile
  const [editingField, setEditingField] = useState(null); // 'name' | 'mobile' | null
  const [fieldValue, setFieldValue] = useState("");

  // Password change form state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

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

  // 📸 PHOTO UPLOAD — same base64-via-FileReader pattern as OwnerProfile,
  // just targeting the trainer's own `photo` field via updateTrainerField.
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      dispatch(updateTrainerField({
        gymId: gym.id,
        trainerId: trainer.id,
        field: "photo",
        value: reader.result,
      }));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemovePhoto = () => {
    dispatch(updateTrainerField({ gymId: gym.id, trainerId: trainer.id, field: "photo", value: "" }));
  };

  // ✏️ INLINE EDIT — name & mobile
  const startEditing = (field) => {
    setEditingField(field);
    setFieldValue(trainer[field] || "");
  };

  const saveEditing = () => {
    if (!fieldValue.trim()) return;
    dispatch(updateTrainerField({
      gymId: gym.id,
      trainerId: trainer.id,
      field: editingField,
      value: fieldValue.trim(),
    }));
    setEditingField(null);
  };

  const cancelEditing = () => {
    setEditingField(null);
    setFieldValue("");
  };

  // 🔑 PASSWORD CHANGE
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordMessage("");

    if (!newPassword || newPassword.length < 4) {
      setPasswordMessage("Password must be at least 4 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage("Passwords do not match.");
      return;
    }

    dispatch(setTrainerPassword({ gymId: gym.id, trainerId: trainer.id, newPassword }));
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMessage("Password updated successfully.");
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto bg-gray-50 min-h-screen pb-16 text-gray-900">

      {/* HEADER — photo + name centered, matches OwnerProfile's layout */}
      <div className="flex flex-col items-center text-center border-b border-gray-200 pb-6 mb-6">
        <div className="relative shrink-0 mb-3">
          <div className="h-20 w-20 md:h-24 md:w-24 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-sm flex items-center justify-center">
            {trainer.photo ? (
              <img src={trainer.photo} alt={trainer.name} className="h-full w-full object-cover" />
            ) : (
              <User className="h-10 w-10 md:h-12 md:w-12 text-gray-400" />
            )}
          </div>
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            title="Change photo"
            className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md border-2 border-white transition-colors cursor-pointer"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>

        {/* Name — inline editable */}
        {editingField === "name" ? (
          <div className="flex items-center gap-2 mt-1">
            <input
              type="text"
              value={fieldValue}
              onChange={(e) => setFieldValue(e.target.value)}
              className="text-xl font-bold text-center bg-white border border-blue-500 rounded-lg px-3 py-1.5 focus:outline-none"
              autoFocus
            />
            <button onClick={saveEditing} className="p-1.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200 cursor-pointer">
              <Check className="h-4 w-4" />
            </button>
            <button onClick={cancelEditing} className="p-1.5 bg-gray-50 text-gray-500 rounded-md border border-gray-200 cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
            {trainer.name}
            <button onClick={() => startEditing("name")} className="text-gray-300 hover:text-blue-600 cursor-pointer">
              <Edit2 className="h-4 w-4" />
            </button>
          </h1>
        )}

        <p className="text-gray-500 text-xs md:text-sm mt-1">
          Trainer at {gym.name}
        </p>

        {trainer.photo && (
          <button
            type="button"
            onClick={handleRemovePhoto}
            className="text-[11px] text-red-500 hover:text-red-600 font-medium mt-1.5 cursor-pointer"
          >
            Remove photo
          </button>
        )}
      </div>

      {/* MOBILE NUMBER */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Phone className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400 font-medium">Mobile Number</p>
              {editingField === "mobile" ? (
                <input
                  type="tel"
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  className="text-sm font-semibold bg-gray-50 border border-blue-500 rounded-lg px-2 py-1 focus:outline-none mt-0.5"
                  autoFocus
                />
              ) : (
                <p className="text-sm font-semibold text-gray-900">{trainer.mobile}</p>
              )}
            </div>
          </div>

          {editingField === "mobile" ? (
            <div className="flex items-center gap-1.5">
              <button onClick={saveEditing} className="p-1.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200 cursor-pointer">
                <Check className="h-4 w-4" />
              </button>
              <button onClick={cancelEditing} className="p-1.5 bg-gray-50 text-gray-500 rounded-md border border-gray-200 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button onClick={() => startEditing("mobile")} className="text-gray-300 hover:text-blue-600 cursor-pointer">
              <Edit2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* PASSWORD CHANGE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-8">
        <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 mb-4">
          <KeyRound className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Change Password</h3>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          <div>
            <label className="block text-xs uppercase font-bold text-gray-500 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
              placeholder="Enter new password"
              required
            />
          </div>
          <div>
            <label className="block text-xs uppercase font-bold text-gray-500 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
              placeholder="Re-enter new password"
              required
            />
          </div>

          {passwordMessage && (
            <p className={`text-xs font-medium ${passwordMessage.includes("success") ? "text-emerald-600" : "text-red-500"}`}>
              {passwordMessage}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold uppercase tracking-wider p-3 rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            Update Password
          </button>
        </form>
      </div>

      {/* LOGOUT — full-width button at the bottom, one canonical place */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 transition px-4 py-3 rounded-xl text-sm font-bold border border-red-200 cursor-pointer"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>

    </div>
  );
}