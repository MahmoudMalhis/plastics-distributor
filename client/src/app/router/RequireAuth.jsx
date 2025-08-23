// client/src/app/router/RequireAuth.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";

const PUBLIC_ROUTES = ["/login", "/set-password"];

function normalizeRole(r) {
  if (!r) return null;
  const x = String(r).toLowerCase().trim();
  // مرادفات شائعة/أخطاء إملائية
  if (x === "distributor") return "distributor";
  return x;
}

function getUserRole() {
  // 1) من userRole المباشر
  const r1 = normalizeRole(localStorage.getItem("userRole"));
  if (r1) return r1;

  // 2) من user.role أو user.roles[0]
  try {
    const raw = localStorage.getItem("user");
    const u = raw ? JSON.parse(raw) : null;
    const r2 = normalizeRole(u?.role);
    if (r2) return r2;
    const r3 = normalizeRole(Array.isArray(u?.roles) ? u.roles[0] : null);
    if (r3) return r3;
  } catch (error) {
    console.log(error);
  }
  return null;
}

export default function RequireAuth({ allowedRoles = [] }) {
  const loc = useLocation();
  const path = loc.pathname;
  const access = localStorage.getItem("accessToken");

  // مسارات عامة
  if (PUBLIC_ROUTES.some((r) => path.startsWith(r))) return <Outlet />;

  // غير مسجّل
  if (!access) return <Navigate to="/login" state={{ from: loc }} replace />;

  // تحقّق الأدوار
  if (allowedRoles.length > 0) {
    const role = getUserRole();
    const need = allowedRoles.map((r) => normalizeRole(r));
    if (!role || !need.includes(role)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }
  return <Outlet />;
}
