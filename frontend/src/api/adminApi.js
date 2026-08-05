// src/api/adminApi.js
import api from "./axios.js";

export const getAdminProfileApi = (customHeaders = {}) =>
  api.get("/admin/profile", { headers: customHeaders });

export const changeAdminPasswordApi = (data, customHeaders = {}) =>
  api.patch("/admin/change-password", data, { headers: customHeaders });

export const getAllGymsApi = (customHeaders = {}) =>
  api.get("/admin/gyms", { headers: customHeaders });

export const updateGymApi = (id, data, customHeaders = {}) =>
  api.put(`/admin/gyms/${id}`, data, { headers: customHeaders });

export const createGymApi = (data, customHeaders = {}) =>
  api.post("/admin/createGyms", data, { headers: customHeaders });

// 🚀 FIX: axios.delete(url, config) only takes 2 args — passing `data`
// as a positional second arg was both wrong (delete has no body slot
// there) and a ReferenceError (`data` didn't exist in this scope).
export const deleteGymApi = (id, customHeaders = {}) =>
  api.delete(`/admin/gyms/${id}`, { headers: customHeaders });

// 🆕 Add a trainer to an existing gym
export const addTrainerApi = (gymId, trainerData, customHeaders = {}) =>
  api.post(`/admin/gyms/${gymId}/trainers`, trainerData, {
    headers: customHeaders,
  });

// 🆕 Remove a trainer from a gym
export const deleteTrainerApi = (gymId, trainerId, customHeaders = {}) =>
  api.delete(`/admin/gyms/${gymId}/trainers/${trainerId}`, {
    headers: customHeaders,
  });