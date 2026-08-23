import axios from "axios";
import { Capacitor } from "@capacitor/core";
import { store } from "../redux/store.js";
import { logout } from "../redux/slices/authSlice.js";
import { getStoredToken, removeStoredToken } from "../utils/secureStorage.js";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    // Sends the httpOnly auth cookie automatically on every request —
    // this is what makes the website's cookie-based session work.
    // Harmless for the APK, which doesn't rely on cookies at all.
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(async (config) => {
    // Website: nothing to attach — the browser sends the httpOnly
    // cookie automatically, and JS can't (and shouldn't) touch it.
    // APK: no cookie to rely on, so the token from native secure
    // storage is attached as a normal Bearer header, same as before.
    if (Capacitor.isNativePlatform()) {
        const token = await getStoredToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
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
            removeStoredToken(); // no-ops on web
            store.dispatch(logout());

            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
);

export default api;