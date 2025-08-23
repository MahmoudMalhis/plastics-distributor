import { useEffect, useState, useCallback } from "react";
import useApiState from "../../../hooks/useApiState";
import { checkInitialized, login as loginApi } from "../api/auth.api";

/** يتحقق من حالة تهيئة النظام (هل يوجد admin أم لا) */
export function useAuthInit() {
  const [initialized, setInitialized] = useState(null);
  const { loading, error, setLoading, setError, reset } = useApiState();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      reset();
      try {
        setLoading(true);
        const data = await checkInitialized();
        if (!cancelled) setInitialized(!!data.initialized);
      } catch (e) {
        // فى حالة الخطأ اعتبر النظام مهيّأً لتجنّب توقّف الشاشة
        setError(
          e?.message ||
            e?.response?.data?.error ||
            "تعذر التحقق من حالة التهيئة"
        );
        setInitialized(true);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setLoading, setError, reset]);

  return { initialized, loading, error };
}

/**
 * تهيئة المسؤول الأول باستخدام منطق الـ bootstrap فى الخادم.
 * تستدعى login مباشرةً عندما لا يوجد مستخدمون، ثم تخزن التوكنات فى localStorage.
 */
export function useSetupInitialAdmin() {
  const { loading, error, setLoading, setError, reset } = useApiState();

  const setupInitialAdmin = useCallback(
    async ({ username, password, password2 }) => {
      reset();
      if (!username || !password || !password2) {
        setError("الرجاء إدخال اسم المستخدم وكلمتي المرور.");
        return { ok: false };
      }
      if (password !== password2) {
        setError("كلمات المرور غير متطابقة.");
        return { ok: false };
      }
      try {
        setLoading(true);
        const data = await loginApi({ username, password });
        if (data?.accessToken)
          localStorage.setItem("accessToken", data.accessToken);
        if (data?.refreshToken)
          localStorage.setItem("refreshToken", data.refreshToken);
        return { ok: true, data };
      } catch (e) {
        setError(
          e?.response?.data?.error || "حدث خطأ أثناء إنشاء حساب المسؤول."
        );
        return { ok: false };
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, reset]
  );

  return { setupInitialAdmin, loading, error };
}

/** تسجيل الدخول وتخزين التوكنات محليًا */
export function useLogin() {
  const { loading, error, setLoading, setError, reset } = useApiState();

  const login = useCallback(
    async ({ username, password }) => {
      reset();
      if (!username || !password) {
        setError("الرجاء إدخال اسم المستخدم وكلمة المرور.");
        return { ok: false };
      }
      try {
        setLoading(true);
        const data = await loginApi({ username, password });
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        return { ok: true, data };
      } catch (e) {
        setError(
          e?.response?.data?.error === "bad creds"
            ? "بيانات الدخول غير صحيحة."
            : e?.response?.data?.error || "حدث خطأ أثناء تسجيل الدخول."
        );
        return { ok: false };
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, reset]
  );

  return { login, loading, error };
}
