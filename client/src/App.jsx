import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./features/auth/pages/Login.jsx";
import AdminProducts from "./features/products/pages/AdminProducts.jsx";
import AdminCategories from "./features/categories/pages/AdminCategories.jsx";
import RequireAuth from "./app/router/RequireAuth.jsx";
import Layout from "./app/router/Layout.jsx";
import DistributorsList from "./features/distributors/pages/DistributorsList.jsx";

export default function App() {
  return (
    <div className="h-screen bg-gray-50 text-gray-900">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/distributors" element={<DistributorsList />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
}
