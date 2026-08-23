import api from "./axios.js";

export const adminLogin=(data)=>   api.post("/auth/admin-login",data);

export const sendOtp=(data)=>    api.post("/auth/send-otp",data);

export const verifyOtp=(data)=>    api.post("/auth/verify-otp",data);

// Session-restore for the website (relies on the httpOnly cookie).
// The APK sends its Bearer header the normal way via the axios
// interceptor, so this same call works for both platforms.
export const getMeApi = () => api.get("/auth/me");

// Clears the httpOnly cookie server-side. Native token removal
// happens separately on the client (secureStorage), since the server
// has no reach into the device's secure storage.
export const logoutApi = () => api.post("/auth/logout");