import api from "./axios"

export const createGym=(data)=> api.post("/admin/createGyms",data);