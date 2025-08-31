import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setOpen(!open);
  };

  const role = localStorage.getItem("userRole");

  const links = [
    {
      to: "/admin/products",
      label: "المنتجات",
      icon: "inventory_2",
      role: ["admin"],
    },
    {
      to: "/admin/categories",
      label: "التصنيفات",
      icon: "category",
      role: ["admin"],
    },
    {
      to: "/admin/distributors",
      label: "الموزعين",
      icon: "local_shipping",
      role: ["admin"],
    },
    {
      to: "/distributor/catalog",
      label: "الكاتالوج",
      icon: "storefront",
      role: ["distributor"],
    },
    {
      to: "/distributor/cart",
      label: "السلة",
      icon: "shopping_cart",
      role: ["distributor"],
    },
    {
      to: "/distributor/orders",
      label: "الطلبات",
      icon: "receipt_long",
      role: ["distributor"],
    },
    {
      to: "/distributor/orders/:id",
      label: "تفاصيل الطلب",
      icon: "receipt",
      role: ["distributor"],
    },
    {
      to: "/customers",
      label: "العملاء",
      icon: "groups",
      role: ["admin", "distributor"],
    },
  ];

  const isActive = (to) => pathname === to;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const userFalter = links.filter((item) => item.role.includes(role));

  return (
    <>
      <button
        onClick={toggleSidebar}
        aria-controls="admin-sidebar"
        aria-expanded={open}
        className="lg:hidden z-50 mt-5 mr-10"
      >
        <span className="material-icons ml-2 sm:ml-3 text-base sm:text-[20px]">
          menu
        </span>
      </button>
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          aria-hidden="true"
        />
      )}
      <aside
        id="admin-sidebar"
        dir="rtl"
        className={`
          fixed inset-y-0 right-0 z-50 w-64 bg-white shadow-md
          transform transition-transform duration-300
          ${open ? "translate-x-0" : "translate-x-full"}
          lg:translate-x-0
        `}
        role="navigation"
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800">لوحة التحكم</h1>
        </div>

        <nav className="mt-2 flex-1">
          <ul>
            {userFalter.map((l) => (
              <li key={l.to} className="mb-2 cursor-pointer">
                <Link
                  to={l.to}
                  className={`flex items-center px-6 py-3 ${
                    isActive(l.to)
                      ? "text-gray-700 bg-blue-50 border-r-4 border-blue-500 font-semibold"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="material-icons">{l.icon}</span>
                  <span className="mx-3">{l.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="absolute bottom-0 w-full p-6">
          <button
            onClick={() => {
              localStorage.removeItem("accessToken");
              navigate("/login");
            }}
            className="flex items-center w-full px-4 py-2 text-red-500 rounded-md hover:bg-red-50 cursor-pointer"
          >
            <span className="material-icons">logout</span>
            <span className="mx-3">تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
}
