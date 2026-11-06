import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

const TOKEN_KEY = "mp_access_token";

// ─── Token helpers ────────────────────────────────────────────────────────
export const tokenStore = {
  get: (): string | undefined => Cookies.get(TOKEN_KEY),
  set: (token: string, expiresAt: string) => {
    const expires = new Date(expiresAt);
    Cookies.set(TOKEN_KEY, token, { expires, sameSite: "Lax", secure: false });
  },
  clear: () => Cookies.remove(TOKEN_KEY),
};

// ─── Axios instance ───────────────────────────────────────────────────────
/**
 * In the browser during local development, use relative URLs so requests are proxied
 * via Next.js rewrites (see next.config.js) to Spring Boot at localhost:8080.
 * This completely prevents CORS preflight issues when the frontend runs on port 3001, 3002, etc.
 */
function getBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envUrl && !envUrl.includes("localhost:8080") && !envUrl.includes("127.0.0.1:8080")) {
    return envUrl;
  }
  return "";
}

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

// Attach Bearer token on every request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global 401 handler — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      tokenStore.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

