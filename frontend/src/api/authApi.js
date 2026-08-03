import api from "./axios.js";

export const adminLogin=(data)=>   api.post("/auth/admin-login",data);

export const sendOtp=(data)=>    api.post("/auth/send-otp",data);

export const verifyOtp=(data)=>    api.post("/auth/verify-otp",data);

