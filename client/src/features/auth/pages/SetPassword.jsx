// src/features/auth/pages/SetPassword.jsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { verifyPasswordToken, setPasswordWithToken } from "../api/auth.api";
import { notify } from "../../../utils/alerts";

export default function SetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [error, setError] = useState("");

  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  // عنوان بنفس ستايل صفحة التسجيل
  const Title = ({ children }) => (
    <h2 className="text-[#0d141c] text-[28px] font-bold leading-tight px-4 text-center pb-3 pt-5">
      {children}
    </h2>
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        if (!token) {
          setError("الرابط غير صالح: لا يوجد رمز.");
          setValid(false);
          return;
        }
        await verifyPasswordToken(token);
        if (!cancelled) setValid(true);
      } catch (e) {
        if (!cancelled) {
          const msg = e?.response?.data?.error || "الرابط غير صالح أو منتهي";
          setError(msg);
          setValid(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const disabled = useMemo(
    () => !pwd || !pwd2 || pwd !== pwd2 || submitting,
    [pwd, pwd2, submitting]
  );

  const submit = async (e) => {
    e.preventDefault();
    if (disabled) return;
    try {
      setSubmitting(true);
      await setPasswordWithToken({ token, newPassword: pwd });
      notify("success", "تم تعيين كلمة المرور بنجاح. الرجاء تسجيل الدخول.");
      navigate("/login", { replace: true });
    } catch (e) {
      const msg = e?.response?.data?.error || "تعذر إتمام العملية";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // شاشة التحميل بنفس روح صفحة التسجيل
  if (loading) {
    return (
      <div
        className="relative flex justify-center h-screen flex-col bg-slate-50 overflow-x-hidden"
        style={{ fontFamily: '"Public Sans","Noto Sans",sans-serif' }}
      >
        <div className="flex justify-center items-center">
          <div className="text-gray-500">جارٍ التحقق من الرابط...</div>
        </div>
      </div>
    );
  }

  // شاشة الرابط غير الصالح مع نفس الألوان/الطراز
  if (!valid) {
    return (
      <div
        className="relative flex justify-center h-screen flex-col bg-slate-50 overflow-x-hidden"
        style={{ fontFamily: '"Public Sans","Noto Sans",sans-serif' }}
      >
        <div className="flex justify-center">
          <div className="bg-white border border-[#cedbe8] shadow rounded-2xl p-6 w-80 md:w-[420px] text-center">
            <h2 className="text-[#0d141c] text-[20px] font-bold mb-2">
              تعذر استخدام الرابط
            </h2>
            <p className="text-sm text-[#49739c] mb-4">
              {error || "الرابط غير صالح أو منتهي."}
            </p>
            <Link to="/login" className="underline text-[#0d80f2]">
              العودة لتسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // النموذج بنفس تخطيط وألوان صفحة Login
  return (
    <div
      className="relative flex justify-center h-screen flex-col bg-slate-50 overflow-x-hidden"
      style={{ fontFamily: '"Public Sans","Noto Sans",sans-serif' }}
    >
      <div className="flex justify-center flex-col py-5">
        <Title>تعيين كلمة المرور</Title>

        <form onSubmit={submit} className="space-y-4 mx-auto">
          {/* Password */}
          <div className="flex w-80 md:w-[480px] items-end gap-4 px-4 py-1">
            <label className="flex flex-col min-w-40 flex-1">
              <div className="flex w-full items-stretch rounded-lg">
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="text-[#49739c] flex border border-[#cedbe8] bg-slate-50 items-center justify-center pr-[15px] rounded-r-lg border-l-0 px-2"
                  title={showPwd ? "إخفاء" : "إظهار"}
                >
                  {showPwd ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="currentColor"
                      viewBox="0 0 256 256"
                    >
                      <path d="M201.57,178.29l-128-128a8,8,0,1,0-11.31,11.31l20.7,20.7C57.34,94.89,40.13,112,24,128c26.67,26.67,64.34,56,104,56a107.23,107.23,0,0,0,49.7-12.22l20,20a8,8,0,1,0,11.31-11.31ZM128,168c-30.7,0-60.37-20.1-83.65-40,10.09-8.68,21.66-17.7,34-25.35l18.91,18.91A40,40,0,0,0,128,168Zm0-80a39.76,39.76,0,0,0-14.42,2.72l16.85,16.85A24,24,0,0,1,152,128a8,8,0,0,0,16,0A40,40,0,0,0,128,88Z" />
                      <path d="M208.49,160.49,179,131a143.55,143.55,0,0,0,29-27c-26.67-26.67-64.34-56-104-56a106.62,106.62,0,0,0-35.3,6L79.7,65.09A122.65,122.65,0,0,1,128,56c39.66,0,77.33,29.33,104,56C220.58,125.64,213.86,143.4,208.49,160.49Z" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24px"
                      height="24px"
                      fill="currentColor"
                      viewBox="0 0 256 256"
                    >
                      <path d="M128,56c39.66,0,77.33,29.33,104,56-26.67,26.67-64.34,56-104,56S50.67,138.67,24,112C50.67,85.33,88.34,56,128,56Zm0,88a32,32,0,1,0-32-32A32,32,0,0,0,128,144Z" />
                    </svg>
                  )}
                </button>
                <input
                  type={showPwd ? "text" : "password"}
                  placeholder="********"
                  className="flex w-full min-w-0 flex-1 rounded-lg text-[#0d141c] border border-[#cedbe8] bg-slate-50 h-14 placeholder:text-[#49739c] p-[15px] rounded-r-none border-r-0 pr-2 text-base focus:outline-none"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  autoFocus
                />
              </div>
              <p className="text-xs text-[#49739c] mt-1">
                أدخل كلمة المرور ثم أكدها بالأسفل.
              </p>
            </label>
          </div>

          {/* Confirm Password */}
          <div className="flex w-80 md:w-[480px] items-end gap-4 px-4 py-1">
            <label className="flex flex-col min-w-40 flex-1">
              <div className="flex w-full items-stretch rounded-lg">
                {/* أيقونة قفل بسيطة */}
                <button
                  type="button"
                  onClick={() => setShowPwd2((s) => !s)}
                  className="text-[#49739c] flex border border-[#cedbe8] bg-slate-50 items-center justify-center pr-[15px] rounded-r-lg border-l-0 px-2"
                  title={showPwd2 ? "إخفاء" : "إظهار"}
                >
                  {showPwd2 ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="currentColor"
                      viewBox="0 0 256 256"
                    >
                      <path d="M201.57,178.29l-128-128a8,8,0,1,0-11.31,11.31l20.7,20.7C57.34,94.89,40.13,112,24,128c26.67,26.67,64.34,56,104,56a107.23,107.23,0,0,0,49.7-12.22l20,20a8,8,0,1,0,11.31-11.31ZM128,168c-30.7,0-60.37-20.1-83.65-40,10.09-8.68,21.66-17.7,34-25.35l18.91,18.91A40,40,0,0,0,128,168Zm0-80a39.76,39.76,0,0,0-14.42,2.72l16.85,16.85A24,24,0,0,1,152,128a8,8,0,0,0,16,0A40,40,0,0,0,128,88Z" />
                      <path d="M208.49,160.49,179,131a143.55,143.55,0,0,0,29-27c-26.67-26.67-64.34-56-104-56a106.62,106.62,0,0,0-35.3,6L79.7,65.09A122.65,122.65,0,0,1,128,56c39.66,0,77.33,29.33,104,56C220.58,125.64,213.86,143.4,208.49,160.49Z" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24px"
                      height="24px"
                      fill="currentColor"
                      viewBox="0 0 256 256"
                    >
                      <path d="M128,56c39.66,0,77.33,29.33,104,56-26.67,26.67-64.34,56-104,56S50.67,138.67,24,112C50.67,85.33,88.34,56,128,56Zm0,88a32,32,0,1,0-32-32A32,32,0,0,0,128,144Z" />
                    </svg>
                  )}
                </button>
                <input
                  type={showPwd2 ? "text" : "password"}
                  placeholder="********"
                  className="flex w-full min-w-0 flex-1 rounded-lg text-[#0d141c] border border-[#cedbe8] bg-slate-50 h-14 placeholder:text-[#49739c] p-[15px] rounded-r-none border-r-0 pr-2 text-base focus:outline-none"
                  value={pwd2}
                  onChange={(e) => setPwd2(e.target.value)}
                />
              </div>
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="px-4">
              <div className="text-red-600 text-sm">{error}</div>
            </div>
          )}

          {/* Submit */}
          <div className="flex px-4 py-2">
            <button
              type="submit"
              disabled={disabled}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-4 flex-1 bg-[#0d80f2] text-white text-sm font-bold tracking-[0.015em] disabled:opacity-60"
            >
              <span className="truncate">
                {submitting ? "جارٍ الحفظ..." : "حفظ كلمة المرور"}
              </span>
            </button>
          </div>

          {/* Link back */}
          <div className="px-4 text-center">
            <Link to="/login" className="text-[#49739c] text-sm underline">
              العودة لتسجيل الدخول
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
