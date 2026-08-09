import api from "./axios.js";

export const getInquiriesApi = () => api.get("/owner/enquiries");

export const addInquiryApi = (data) => api.post("/owner/enquiries", data);

export const updateInquiryApi = (id, data) => api.put(`/owner/enquiries/${id}`, data);

export const deleteInquiryApi = (id) => api.delete(`/owner/enquiries/${id}`);