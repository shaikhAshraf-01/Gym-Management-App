import axios from "axios";
import { store } from "../redux/store.js";
import { logout } from "../redux/slices/authSlice.js";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const auth = JSON.parse(localStorage.getItem("fitzone_auth"));
    
    // ✅ FIX: Safely check if 'auth' exists before reading '.token'
    if (auth && auth.token) {
        config.headers.Authorization = `Bearer ${auth.token}`;
    }
    
    return config;
}, (error) => {
    return Promise.reject(error);
});

// 🔐 Any 401 (invalid/expired token, deleted account, etc.) means the
// session is no longer valid server-side — clear it immediately and
// send the user to /login instead of leaving them stuck on whatever
// error state the failed request produced (e.g. a Profile page with
// no logout button, since that button only renders in the
// successful-load branch).
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            store.dispatch(logout());

            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
);

export default api;