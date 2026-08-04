import api from "./axios.js";

// Fetch fresh admin profile data
export const getAdminProfileApi = () => api.get("/admin/profile");

// Patch change password payload
export const changeAdminPasswordApi = (data) => api.patch("/admin/change-password", data);
