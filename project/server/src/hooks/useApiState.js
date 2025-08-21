import { useCallback, useState } from "react";

// إضافة دالة reset مفقودة:
export default function useApiState() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = useCallback(() => {
    setLoading(false);
    setError("");
  }, []);

  const run = useCallback(async (fn) => {
    setError("");
    setLoading(true);
    try {
      const result = await fn();
      return result;
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "حدث خطأ");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, setError, setLoading, reset, run };
}
