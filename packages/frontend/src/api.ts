import axios, { AxiosInstance } from 'axios';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '';

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('flowforge_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('flowforge_token');
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/login') &&
        !window.location.pathname.startsWith('/register')
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);
