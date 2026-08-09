import api from "./axios.js";

// ================= OWNER PROFILE =================
export const getOwnerProfileApi = () => 
  api.get("/owner/profile");

// ================= GYM LOGO =================
// Upload / Replace Logo
export const uploadGymLogoApi = (formData) =>
  api.patch("/owner/logo", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// Remove Logo
export const removeGymLogoApi = () => 
  api.delete("/owner/logo");