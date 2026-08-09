import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 1. Request Interceptor: Safely attach Authorization token
api.interceptors.request.use(
  (config) => {
    try {
      const storedAuth = localStorage.getItem("fitzone_auth");
      const auth = storedAuth ? JSON.parse(storedAuth) : null;

      if (auth && auth.token) {
        config.headers.Authorization = `Bearer ${auth.token}`;
      }
    } catch (error) {
      console.error("Error parsing auth token from localStorage:", error);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: Automatically handle expired tokens (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If backend returns 401 (Unauthorized / Expired Token)
    if (error.response && error.response.status === 401) {
      console.warn("Token expired or invalid. Clearing session...");
      
      // Clear expired storage
      localStorage.removeItem("fitzone_auth");

      // Redirect user to login page if they aren't already there
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;