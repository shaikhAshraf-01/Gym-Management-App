import api from "./axios.js";

export const getMembersApi = () => api.get("/owner/members");

export const addMemberApi = (data) => api.post("/owner/members", data);

export const updateMemberApi = (id, data) => api.put(`/owner/members/${id}`, data);

export const deleteMemberApi = (id) => api.delete(`/owner/members/${id}`);

export const extendMembershipApi = (id, data) => api.post(`/owner/members/${id}/extend`, data);