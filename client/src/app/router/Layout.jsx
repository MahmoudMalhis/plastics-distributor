import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../../components/ui/Sidebar.jsx";
import { useEffect } from "react";
import socket from "../socket/socket.js";

export default function Layout() {
  const navigate = useNavigate();

  useEffect(() => {
    // اقرأ بيانات المستخدم المخزّنة بعد تسجيل الدخول
    const rawUser = localStorage.getItem("user");
    const user = rawUser ? JSON.parse(rawUser) : null;

    if (user && user.id) {
      // افتح الاتصال
      socket.connect();
      // انضم إلى غرفة باسم user:{id} ليتلقى الأحداث الخاصة به
      socket.emit("joinUserRoom", { userId: user.id });

      // استمع لحدث account_disabled
      socket.on("account_disabled", () => {
        // عند التعطيل: امسح التوكنات والبيانات وأعد التوجيه
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        localStorage.removeItem("userRole");
        socket.disconnect();
        navigate("/login");
      });
    }

    // نظّف المستمعين عند التفكيك
    return () => {
      socket.off("account_disabled");
    };
  }, [navigate]);
  return (
    <div className="">
      <Sidebar />
      <main className="lg:w-[calc(100%-16rem)] lg:mr-auto p-10">
        <Outlet />
      </main>
    </div>
  );
}
