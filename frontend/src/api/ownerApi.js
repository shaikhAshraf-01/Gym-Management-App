import api from "./axios.js";
// ================= OWNER PROFILE =================
export const getOwnerProfileApi = (customHeaders = {}) =>
  api.get("/owner/profile", {
    headers: customHeaders,
  });
// ================= GYM LOGO =================
// Upload / Replace Logo
export const uploadGymLogoApi = (formData, customHeaders = {}) =>
  api.patch("/owner/logo", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      ...customHeaders,
    },
  });

// Remove Logo
export const removeGymLogoApi = (customHeaders = {}) =>
  api.delete("/owner/logo", {
    headers: customHeaders,
  });