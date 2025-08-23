import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthInit, useLogin, useSetupInitialAdmin } from "../hooks/useAuth";
import { useMemo } from "react";

export default function Login() {
  const { initialized, loading: initLoading, error: initError } = useAuthInit();
  const { login, loading: loginLoading, error: loginError } = useLogin();
  const {
    setupInitialAdmin,
    loading: setupLoading,
    error: setupError,
  } = useSetupInitialAdmin();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const [adminUser, setAdminUser] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPassword2, setAdminPassword2] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const navigate = useNavigate();

  const loading = initLoading || loginLoading || setupLoading;
  const error = useMemo(
    () => initError || loginError || setupError || "",
    [initError, loginError, setupError]
  );

  // 3) أحداث الإرسال
  const submit = async (e) => {
    e.preventDefault();
    const res = await login({ username, password });
    if (res.ok) {
      const role = res.data?.user?.role;
      if (role === "admin") navigate("/admin/products", { replace: true });
      else navigate("/distributor/catalog", { replace: true });
    }
  };
  const submitInitialization = async (e) => {
    e.preventDefault();
    // setupInitialAdmin يستدعي login داخليًا عند عدم وجود مستخدمين
    const res = await setupInitialAdmin({
      username: adminUser,
      password: adminPassword,
      password2: adminPassword2,
    });
    if (res.ok) {
      // بمجرد إنشاء المسؤول بنجاح، انتقل إلى لوحة التحكم الإدارية
      navigate("/admin/products", { replace: true });
    }
  };

  const Title = ({ children }) => (
    <h2 className="text-[#0d141c] text-[28px] font-bold leading-tight px-4 text-center pb-3 pt-5">
      {children}
    </h2>
  );

  if (initialized === null) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-500">جارٍ التحقق من التهيئة...</div>
      </div>
    );
  }

  return (
    <div
      className="relative flex justify-center h-screen flex-col bg-slate-50 overflow-x-hidden"
      style={{ fontFamily: '"Public Sans","Noto Sans",sans-serif' }}
    >
      <div className="flex justify-center flex-col py-5">
        {initialized ? (
          <>
            <Title>تسجيل الدخول</Title>
            <form onSubmit={submit} className="space-y-4 mx-auto">
              <div className="flex w-80 md:w-[480px] items-end gap-4 px-4 py-1">
                <label className="flex flex-col min-w-40 flex-1">
                  <div className="flex w-full items-stretch rounded-lg">
                    <div className="text-[#49739c] flex border border-[#cedbe8] bg-slate-50 items-center justify-center pr-[15px] rounded-r-lg border-l-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24px"
                        height="24px"
                        fill="currentColor"
                        viewBox="0 0 256 256"
                      >
                        <path d="M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48Zm-96,85.15L52.57,64H203.43ZM98.71,128,40,181.81V74.19Zm11.84,10.85,12,11.05a8,8,0,0,0,10.82,0l12-11.05,58,53.15H52.57ZM157.29,128,216,74.18V181.82Z" />
                      </svg>
                    </div>
                    <input
                      dir="rtl"
                      placeholder="اسم المستخدم"
                      className="flex w-full min-w-0 flex-1 rounded-lg text-[#0d141c] border border-[#cedbe8] bg-slate-50 h-14 placeholder:text-[#49739c] p-[15px] rounded-r-none border-r-0 pr-2 text-base focus:outline-none"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </label>
              </div>

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
                      {/* Lock / Eye icon */}
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
                    </button>{" "}
                    <input
                      dir="rtl"
                      type={showPwd ? "text" : "password"}
                      placeholder="كلمة المرور"
                      className="flex w-full min-w-0 flex-1 rounded-lg text-[#0d141c] border border-[#cedbe8] bg-slate-50 h-14 placeholder:text-[#49739c] p-[15px] rounded-r-none border-r-0 pr-2 text-base focus:outline-none"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </label>
              </div>

              {/* Error */}
              {error && (
                <div className="px-4">
                  {error && <div className="text-red-600 text-sm">{error}</div>}
                </div>
              )}

              {/* Submit */}
              <div className="flex px-4 py-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-4 flex-1 bg-[#0d80f2] text-white text-sm font-bold tracking-[0.015em] disabled:opacity-60"
                >
                  <span className="truncate">
                    {loading ? "جارٍ الدخول..." : "تسجيل الدخول"}
                  </span>
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <Title>تهيئة المسؤول</Title>
            <form onSubmit={submitInitialization} className="space-y-4 mx-auto">
              <div className="flex w-80 md:w-[480px] items-end gap-4 px-4 py-1">
                <label className="flex flex-col min-w-40 flex-1">
                  <div className="flex w-full items-stretch rounded-lg">
                    <div className="text-[#49739c] flex border border-[#cedbe8] bg-slate-50 items-center justify-center pr-[15px] rounded-r-lg border-l-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24px"
                        height="24px"
                        fill="currentColor"
                        viewBox="0 0 256 256"
                      >
                        <path d="M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48Zm-96,85.15L52.57,64H203.43ZM98.71,128,40,181.81V74.19Zm11.84,10.85l12,11.05a8,8,0,0,0,10.82,0l12-11.05,58,53.15H52.57ZM157.29,128L216,74.18V181.82Z" />
                      </svg>
                    </div>
                    <input
                      dir="rtl"
                      placeholder="اسم المستخدم"
                      className="flex w-full min-w-0 flex-1 rounded-lg text-[#0d141c] border border-[#cedbe8] bg-slate-50 h-14 placeholder:text-[#49739c] p-[15px] rounded-r-none border-r-0 pr-2 text-base focus:outline-none"
                      value={adminUser}
                      onChange={(e) => setAdminUser(e.target.value)}
                    />
                  </div>
                </label>
              </div>

              {/* Password */}
              <div className="flex w-80 md:w-[480px] items-end gap-4 px-4 py-1">
                <label className="flex flex-col min-w-40 flex-1">
                  <div className="flex w-full items-stretch rounded-lg">
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword((s) => !s)}
                      className="text-[#49739c] flex border border-[#cedbe8] bg-slate-50 items-center justify-center pr-[15px] rounded-r-lg border-l-0 px-2"
                      title={showAdminPassword ? "إخفاء" : "إظهار"}
                    >
                      {showAdminPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24px"
                          height="24px"
                          fill="currentColor"
                          viewBox="0 0 256 256"
                        >
                          <path d="M201.57,178.29l-128-128a8,8,0,1,0-11.31,11.31l20.7,20.7C57.34,94.89,40.13,112,24,128c26.67,26.67,64.34,56,104,56a107.23,107.23,0,0,0,49.7-12.22l20,20a8,8,0,1,0,11.31-11.31ZM128,168c-30.7,0-60.37-20.1-83.65-40,10.09-8.68,21.66-17.7,34-25.35l18.91,18.91A40,40,0,0,0,128,168Zm0-80a39.76,39.76,0,0,0-14.42,2.72l16.85,16.85A24,24,0,0,1,152,128a8,8,0,0,0,16 0A40 40 0 0 0 128 88Z" />
                          <path d="M208.49 160.49L179 131a143.55 143.55 0 0 0 29-27c-26.67-26.67-64.34-56-104-56a106.62 106.62 0 0 0 -35.3 6L79.7 65.09A122.65 122.65 0 0 1 128 56c39.66 0 77.33 29.33 104 56C220.58 125.64 213.86 143.4 208.49 160.49Z" />
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
                      dir="rtl"
                      type={showAdminPassword ? "text" : "password"}
                      placeholder="كلمة المرور"
                      className="flex w-full min-w-0 flex-1 rounded-lg text-[#0d141c] border border-[#cedbe8] bg-slate-50 h-14 placeholder:text-[#49739c] p-[15px] rounded-r-none border-r-0 pr-2 text-base focus:outline-none"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                    />
                  </div>
                </label>
              </div>
              <div className="flex w-80 md:w-[480px] items-end gap-4 px-4 py-1">
                <label className="flex flex-col min-w-40 flex-1">
                  <div className="flex w-full items-stretch rounded-lg">
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword((s) => !s)}
                      className="text-[#49739c] flex border border-[#cedbe8] bg-slate-50 items-center justify-center pr-[15px] rounded-r-lg border-l-0 px-2"
                      title={showAdminPassword ? "إخفاء" : "إظهار"}
                    >
                      {showAdminPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24px"
                          height="24px"
                          fill="currentColor"
                          viewBox="0 0 256 256"
                        >
                          <path d="M201.57,178.29l-128-128a8,8,0,1,0-11.31,11.31l20.7,20.7C57.34,94.89,40.13,112,24,128c26.67,26.67,64.34,56,104,56a107.23,107.23,0,0,0,49.7-12.22l20,20a8,8,0,1,0,11.31-11.31ZM128,168c-30.7,0-60.37-20.1-83.65-40,10.09-8.68,21.66-17.7,34-25.35l18.91,18.91A40,40,0,0,0,128,168Zm0-80a39.76,39.76,0,0,0-14.42,2.72l16.85,16.85A24,24,0,0,1,152,128a8,8,0,0,0,16 0A40 40 0 0 0 128 88Z" />
                          <path d="M208.49 160.49L179 131a143.55 143.55 0 0 0 29-27c-26.67-26.67-64.34-56-104-56a106.62 106.62 0 0 0 -35.3 6L79.7 65.09A122.65 122.65 0 0 1 128 56c39.66 0 77.33 29.33 104 56C220.58 125.64 213.86 143.4 208.49 160.49Z" />
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
                      dir="rtl"
                      type={showAdminPassword ? "text" : "password"}
                      placeholder="تأكيد كلمة المرور"
                      className="flex w-full min-w-0 flex-1 rounded-lg text-[#0d141c] border border-[#cedbe8] bg-slate-50 h-14 placeholder:text-[#49739c] p-[15px] rounded-r-none border-r-0 pr-2 text-base focus:outline-none"
                      value={adminPassword2}
                      onChange={(e) => setAdminPassword2(e.target.value)}
                    />
                  </div>
                </label>
              </div>
              {/* Error */}
              {error && (
                <div className="px-4">
                  {error && <div className="text-red-600 text-sm">{error}</div>}
                </div>
              )}

              {/* Submit */}
              <div className="flex px-4 py-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-4 flex-1 bg-[#0d80f2] text-white text-sm font-bold tracking-[0.015em] disabled:opacity-60"
                >
                  <span className="truncate">
                    {loading ? "جارٍ التهيئة..." : "تهيئة المسؤول"}
                  </span>
                </button>
              </div>
            </form>
          </>
        )}

        {/* Forgot password (اختياري) */}
        <p className="text-[#49739c] text-sm leading-normal pb-3 pt-1 px-4 text-center underline cursor-pointer">
          نسيت كلمة المرور؟
        </p>
      </div>
    </div>
  );
}
