// src/lib/api.js
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
export const api = axios.create({ baseURL: API_BASE, timeout: 20000 }); // + timeout

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

export function clearTokensAndRedirect() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  if (window.location.pathname !== "/login") window.location.replace("/login");
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

let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config: original, response } = error;

    // شبكة/مهلة
    if (!response) {
      return Promise.reject({
        message: "تعذّر الاتصال بالخادم. تأكد من الشبكة.",
        status: 0,
      });
    }

    // 429: Rate limit
    if (response.status === 429) {
      return Promise.reject({
        message: response.data?.error || "محاولات كثيرة. جرّب لاحقًا.",
        status: 429,
        response,
      });
    }

    // 403: صلاحيات/حساب موقوف
    if (response.status === 403) {
      clearTokensAndRedirect();
      return Promise.reject({
        message: response.data?.error || "ليس لديك صلاحية للوصول.",
        status: 403,
      });
    }

    // 401: جرّب refresh مرّة واحدة فقط، وتجنّب مسارات auth العامة
    const path = (original?.url || "").replace(api.defaults.baseURL, "");
    if (
      response.status === 401 &&
      !original?._retry &&
      !PUBLIC_AUTH_PATHS.has(path)
    ) {
      try {
        original._retry = true;

        if (!refreshing) {
          const rt = getRefresh();
          refreshing = api
            .post("/api/auth/refresh", { refreshToken: rt })
            .then((r) => {
              setTokens({ accessToken: r.data?.accessToken });
              return r.data?.accessToken;
            })
            .finally(() => {
              refreshing = null;
            });
        }

        const newAccess = await refreshing;
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch {
        clearTokensAndRedirect();
      }
    }

    // تطبيع بقية الأخطاء
    return Promise.reject({
      message: response.data?.error || "حدث خطأ غير متوقع.",
      status: response.status,
      data: response.data,
      response,
    });
  }
);
