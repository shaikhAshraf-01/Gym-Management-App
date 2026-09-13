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

// ================= GST DETAILS =================
export const updateGymGstDetailsApi = (gstNumber) =>
  api.patch("/owner/gst-details", { gstNumber });

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

// ================= WHATSAPP AUTOMATION =================
export const connectWhatsappApi = (payload) =>
  api.post("/owner/whatsapp/connect", payload);

export const disconnectWhatsappApi = () =>
  api.delete("/owner/whatsapp/connect");

export const updateWhatsappAutomationSettingsApi = (settings) =>
  api.patch("/owner/whatsapp/automation-settings", settings);

export const updateGymPricingApi = (pricing) =>
  api.patch("/owner/pricing", pricing);

export const testSendWhatsappAutomationApi = (automation, toPhone) =>
  api.post("/owner/whatsapp/test-send", { automation, toPhone });

// ================= OFFER BROADCASTS =================
export const createOfferApi = (payload) => api.post("/owner/whatsapp/offers", payload);

export const listOffersApi = () => api.get("/owner/whatsapp/offers");

export const getAudienceCountApi = (audience) =>
  api.get("/owner/whatsapp/offers/audience-count", { params: { audience } });

export const cancelOfferApi = (offerId) =>
  api.delete(`/owner/whatsapp/offers/${offerId}`);