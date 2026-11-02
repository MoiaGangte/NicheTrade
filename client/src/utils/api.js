import axios from "axios";

export const getApiBaseUrl = () => {
    const rawEnvUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || '';
    return String(rawEnvUrl).trim().replace(/\/+$/, '');
};

export const getBackendUrl = (path = '') => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const baseUrl = getApiBaseUrl();

    if (baseUrl) return `${baseUrl}${cleanPath}`;
    if (typeof window !== 'undefined') return `${window.location.origin}${cleanPath}`;
    return cleanPath;
};

export const getSocketUrl = () => {
    const baseUrl = getApiBaseUrl();
    if (baseUrl) return baseUrl;
    if (typeof window !== 'undefined') return window.location.origin;
    return '';
};

export const api = axios.create({
    withCredentials: true,
    baseURL: getApiBaseUrl(),
});

api.interceptors.request.use(
    (config) => {
        if (!config.baseURL && getApiBaseUrl()) {
            config.baseURL = getApiBaseUrl();
        }

        const isAdminRequest = String(config.url || '').startsWith('/api/admin');
        const token = isAdminRequest
            ? localStorage.getItem('adminToken')
            : localStorage.getItem('token');

        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = 'Bearer ' + token;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

export const getErrorMessage = (error) =>
    error.response?.data?.message || error.message || 'An unexpected error occurred. Please try again.';

export default api;
