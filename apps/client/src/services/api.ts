import axios, { type InternalAxiosRequestConfig } from "axios";
import type { AuthTokensDTO } from "@capsloc/types";

// In-memory token storage (XSS-safe: not accessible via localStorage)
let inMemoryAccessToken: string | null = null;

export const setAccessToken = (token: string | null): void => {
  inMemoryAccessToken = token;
};

export const getAccessToken = (): string | null => {
  return inMemoryAccessToken;
};

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true, // Guarantees HttpOnly refresh cookie is sent
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach in-memory Bearer token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (inMemoryAccessToken && config.headers) {
      config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor: Silent Refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401s that haven't already been retried
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/register") &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      try {
        // Silent refresh call - HttpOnly cookie is attached automatically
        const response = await axios.post<AuthTokensDTO>(
          "/api/auth/refresh",
          {},
          { withCredentials: true },
        );

        const newAccessToken = response.data.accessToken;
        setAccessToken(newAccessToken);

        // Update authorization header on the original request and replay it
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return api(originalRequest); /* use our configured instance and run the originalRequest with
        a newly refreshed access token */
      } catch (refreshError) {
        // Refresh token expired or invalidated; clear token
        setAccessToken(null);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
