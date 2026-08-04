// src/api/adminApi.js
import api from "./axios.js";

export const getAdminProfileApi = (customHeaders = {}) => 
  api.get("/admin/profile", { headers: customHeaders });

// 🚀 FIX: Update this function to accept custom headers as the second parameter
export const changeAdminPasswordApi = (data, customHeaders = {}) => 
  api.patch("/admin/change-password", data, { headers: customHeaders });
