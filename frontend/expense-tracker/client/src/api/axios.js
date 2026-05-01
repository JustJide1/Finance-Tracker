import axios from "axios";
import useAuthStore from "../store/authStore";

const instance = axios.create({ baseURL: "http://localhost:5000/api" });

instance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Auto-logout and redirect on expired / invalid token
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().logout();
            window.location.href = "/";
        }
        return Promise.reject(error);
    }
);

export default instance;
