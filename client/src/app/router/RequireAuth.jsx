import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function RequireAuth() {
  const loc = useLocation();
  const access = localStorage.getItem("accessToken");

  if (!access) {
    return <Navigate to="/login" state={{ from: loc }} replace />;
  }
  return <Outlet />;
}
