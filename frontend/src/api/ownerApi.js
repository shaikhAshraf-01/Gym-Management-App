import api from "./axios.js";
// ================= OWNER PROFILE =================
export const getOwnerProfileApi = () => api.get("/owner/profile");

// ================= GYM LOGO =================
// Upload / Replace Logo
export const uploadGymLogoApi = (formData) =>
  api.patch("/owner/logo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// Remove Logo
export const removeGymLogoApi = () => api.delete("/owner/logo");

// ================= TRAINER PROFILE PHOTO =================
export const uploadTrainerPhotoApi = (formData) =>
  api.patch("/owner/trainer-photo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const removeTrainerPhotoApi = () => api.delete("/owner/trainer-photo");

// ================= OWNER: TRAINER MANAGEMENT =================
export const addTrainerOwnerApi = (trainerData) =>
  api.post("/owner/trainers", trainerData);

export const updateTrainerOwnerApi = (trainerId, trainerData) =>
  api.put(`/owner/trainers/${trainerId}`, trainerData);

export const removeTrainerOwnerApi = (trainerId) =>
  api.delete(`/owner/trainers/${trainerId}`);