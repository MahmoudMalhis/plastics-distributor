// src/lib/api.js
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 20000,
}); // + timeout

// مسارات Auth العامة → لا تحتاج Authorization ولا محاولات refresh
const PUBLIC_AUTH_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/initialized",
  "/api/auth/setup-initial-admin",
  "/api/auth/password-token/verify",
  "/api/auth/set-password",
]);

export function getAccess() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

export function getRefresh() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refreshToken");
}

export function setTokens({ accessToken, refreshToken } = {}) {
  if (typeof window === "undefined") return;
  if (accessToken) localStorage.setItem("accessToken", accessToken);
  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
}

api.interceptors.request.use((cfg) => {
  const path = (cfg.url || "").replace(api.defaults.baseURL, "");
  if (!PUBLIC_AUTH_PATHS.has(path)) {
    const token = getAccess();
    if (token) {
      cfg.headers = cfg.headers || {};
      cfg.headers.Authorization = `Bearer ${token}`;
    }
  }
  return cfg;
});

// src/lib/api.js (تأكد بهذه الروح)
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config: original, response } = error;

    if (!response) {
      return Promise.reject({ message: "تعذّر الاتصال بالخادم.", status: 0 });
    }

    // لا أي توجيهات هنا
    if (response.status === 403) {
      return Promise.reject({
        message: response.data?.error || "ليس لديك صلاحية.",
        status: 403,
        response,
      });
    }

    const path = (original?.url || "").replace(api.defaults.baseURL, "");
    if (
      response.status === 401 &&
      !original?._retry &&
      !PUBLIC_AUTH_PATHS.has(path)
    ) {
      const rt = getRefresh();
      if (!rt) {
        // لا توجيه—فقط رجع الخطأ
        return Promise.reject({
          message: "انتهت الجلسة. سجّل دخولك مجددًا.",
          status: 401,
          response,
        });
      }
      try {
        original._retry = true;
        // refresh logic...
        // لا أي توجيهات هنا أيضًا
      } catch {
        // لا توجيه
        return Promise.reject({
          message: "تعذر تجديد الجلسة.",
          status: 401,
          response,
        });
      }
    }

    return Promise.reject({
      message: response.data?.error || "حدث خطأ غير متوقع.",
      status: response.status,
      data: response.data,
      response,
    });
  }
);
