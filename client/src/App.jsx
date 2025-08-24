import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./features/auth/pages/Login.jsx";
import AdminProducts from "./features/products/pages/AdminProducts.jsx";
import AdminCategories from "./features/categories/pages/AdminCategories.jsx";
import RequireAuth from "./app/router/RequireAuth.jsx";
import Layout from "./app/router/Layout.jsx";
import DistributorsList from "./features/distributors/pages/DistributorsList.jsx";
import SetPassword from "./features/auth/pages/SetPassword.jsx";
import CartEditor from "./features/orders/pages/CartEditor.jsx";
import MyOrders from "./features/orders/pages/MyOrders.jsx";
import OrderDetails from "./features/orders/pages/OrderDetails.jsx";
import DistributorCatalog from "./features/orders/pages/DistributorCatalog.jsx";
import Unauthorized from "./app/router/Unauthorized.jsx";
import ProductDetails from "./features/products/pages/ProductDetails.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/set-password" element={<SetPassword />} />

        {/* مسارات الإدمن فقط */}
        <Route element={<RequireAuth allowedRoles={["admin"]} />}>
          <Route element={<Layout />}>
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/distributors" element={<DistributorsList />} />
          </Route>
        </Route>

        {/* مسارات الموزع فقط */}
        <Route element={<RequireAuth allowedRoles={["distributor"]} />}>
          <Route element={<Layout />}>
            <Route
              path="/distributor/catalog"
              element={<DistributorCatalog />}
            />
            <Route path="/distributor/cart" element={<CartEditor />} />
            <Route path="/distributor/orders" element={<MyOrders />} />
            <Route path="/distributor/orders/:id" element={<OrderDetails />} />
            <Route
              path="/distributor/products/:id"
              element={<ProductDetails />}
            />
          </Route>
        </Route>

        {/* مسارات مشتركة لكلا الدورين */}
        <Route
          element={<RequireAuth allowedRoles={["admin", "distributor"]} />}
        >
          <Route element={<Layout />}>{/* أضف هنا أي صفحات مشتركة */}</Route>
        </Route>
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
}
