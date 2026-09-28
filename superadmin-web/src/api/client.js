import axios from 'axios';
import { useAuthStore } from '../store/authStore';
const baseURL = import.meta.env.VITE_API_URL || '';
export const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});
let isRefreshing = false;
let failedQueue = [];
const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        }
        else if (token) {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));
api.interceptors.response.use((response) => response, async (error) => {
    const originalRequest = error.config;
    // Do not attempt refresh on auth login/refresh endpoints
    if (originalRequest?.url?.includes('/api/v1/superadmin/auth/login') ||
        originalRequest?.url?.includes('/api/v1/superadmin/auth/refresh')) {
        return Promise.reject(error);
    }
    if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            })
                .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);
            })
                .catch((err) => Promise.reject(err));
        }
        originalRequest._retry = true;
        isRefreshing = true;
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) {
            useAuthStore.getState().logout();
            return Promise.reject(error);
        }
        try {
            const { data } = await axios.post(`${baseURL}/api/v1/superadmin/auth/refresh`, {
                refreshToken,
            });
            const newAccessToken = data.data.accessToken;
            useAuthStore.getState().setAccessToken(newAccessToken);
            processQueue(null, newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
        }
        catch (refreshErr) {
            processQueue(refreshErr, null);
            useAuthStore.getState().logout();
            return Promise.reject(refreshErr);
        }
        finally {
            isRefreshing = false;
        }
    }
    return Promise.reject(error);
});
