/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-location-assign-relative-destination */
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5036';

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    const language = useLanguageStore.getState().language;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['Accept-Language'] = language;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Handle Refresh Token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loop if auth endpoints fail
    if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh-token')) {
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
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuthStore.getState().refreshToken;
      const user = useAuthStore.getState().user;

      if (!refreshToken || !user) {
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_URL}/api/v1/auth/refresh-token`, {
          token: refreshToken,
        });

        if (response.data?.success) {
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          useAuthStore.getState().setAuth(accessToken, newRefreshToken, user);
          
          processQueue(null, accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } else {
          throw new Error('Refresh token request failed');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
