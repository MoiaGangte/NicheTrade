import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const TOKEN_KEY = 'nichetrade.token';
export const ADMIN_TOKEN_KEY = 'nichetrade.admin-token';
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://eimi-cart-backend.vercel.app').replace(/\/+$/, '');

export const getStoredToken = (key) => (
  Platform.OS === 'web' ? Promise.resolve(globalThis.localStorage.getItem(key)) : SecureStore.getItemAsync(key)
);

export const setStoredToken = (key, token) => (
  Platform.OS === 'web' ? Promise.resolve(globalThis.localStorage.setItem(key, token)) : SecureStore.setItemAsync(key, token)
);

export const removeStoredToken = (key) => (
  Platform.OS === 'web' ? Promise.resolve(globalThis.localStorage.removeItem(key)) : SecureStore.deleteItemAsync(key)
);

const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  const token = await getStoredToken(
    config.url?.startsWith('/api/admin') ? ADMIN_TOKEN_KEY : TOKEN_KEY,
  );
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getErrorMessage = (error) =>
  error.response?.data?.message || error.message || 'Something went wrong. Please try again.';

export default api;
