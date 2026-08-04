import axios from "axios";
const api=axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers:{
        "Content-Type":"application/json",
    },
})
api.interceptors.request.use((config)=>{
    const auth=JSON.parse(localStorage.getItem("fitzone_auth"));
    if(auth.token){
        config.headers.Authorization=`Bearer ${auth.token}`;
    }
    return config;
}
)
export default api;