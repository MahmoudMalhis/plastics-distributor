import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getCustomer } from "../api/customers.api";
import PageHeader from "../../../components/ui/PageHeader";

export default function CustomerProfile() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getCustomer(id);
        if (!cancelled) setCustomer(data);
      } catch (e) {
        if (!cancelled)
          setError(e?.response?.data?.error || "تعذر تحميل بيانات العميل");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-10 text-center">
        جارٍ التحميل...
      </div>
    );
  }
  if (error || !customer) {
    return (
      <div className="min-h-screen bg-slate-50 p-10 text-center">
        <h2 className="text-lg font-bold mb-2">تعذر عرض بيانات العميل</h2>
        <p className="text-[#49739c] mb-4">{error || "العميل غير موجود"}</p>
        <Link to="/customers" className="underline text-blue-600">
          العودة لقائمة العملاء
        </Link>
      </div>
    );
  }

  const orders = customer.orders || [];

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto py-5">
        <PageHeader title={`ملف العميل: ${customer.name}`}>
          <button
            className="relative inline-flex items-center justify-center bg-blue-600 text-white font-bold py-2.5 px-4 sm:px-5 rounded-lg shadow-md hover:bg-blue-700 transition cursor-pointer"
            onClick={() => navigate("/customers")}
          >
            <span className="material-icons">keyboard_backspace</span>
          </button>
        </PageHeader>
        {/* بيانات العميل */}
        <div className="bg-white border border-[#cedbe8] rounded-xl p-4 mb-6">
          <h3 className="text-xl font-bold mb-3">البيانات الأساسية</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <Info label="الاسم" value={customer.name} />
            <Info label="الكود" value={customer.customer_sku} />
            <Info label="الهاتف" value={customer.phone || "—"} />
            <Info label="العنوان" value={customer.address || "—"} />
            <Info label="الملاحظات" value={customer.notes || "—"} />
            <Info label="الحالة" value={customer.active ? "نشط" : "موقوف"} />
            <Info
              label="الرصيد الحالي"
              value={`${Number(customer.balance || 0).toLocaleString()} ₪`}
            />
            <Info
              label="عدد الطلبات"
              value={
                customer.ordersCount != null
                  ? customer.ordersCount
                  : orders.length
              }
            />
            <Info
              label="الموقع"
              value={
                customer.latitude && customer.longitude ? (
                  <a
                    href={`https://www.google.com/maps?q=${customer.latitude},${customer.longitude}`}
                    className="text-blue-600 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    فتح الخريطة
                  </a>
                ) : (
                  "—"
                )
              }
            />
          </div>
        </div>

        {/* قائمة الطلبات */}
        <div className="bg-white border border-[#cedbe8] rounded-xl p-4">
          <h3 className="text-xl font-bold mb-3">طلباته</h3>
          {orders.length === 0 ? (
            <div className="text-[#49739c]">لا توجد طلبات</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 text-[#49739c]">
                  <tr>
                    <th className="py-2 px-4 text-right">#</th>
                    <th className="py-2 px-4 text-right">التاريخ</th>
                    <th className="py-2 px-4 text-right">الحالة</th>
                    <th className="py-2 px-4 text-right">الإجمالي</th>
                    <th className="py-2 px-4 text-right">عرض</th>
                  </tr>
                </thead>
                <tbody className="text-[#0d141c]">
                  {orders.map((o, idx) => (
                    <tr key={o.id} className="border-t border-[#eef3f7]">
                      <td className="py-2 px-4">{idx + 1}</td>
                      <td className="py-2 px-4">{formatDate(o.created_at)}</td>
                      <td className="py-2 px-4">{o.status}</td>
                      <td className="py-2 px-4">
                        {Number(o.total).toLocaleString()} ₪
                      </td>
                      <td className="py-2 px-4">
                        <Link
                          to={`/admin/orders/${o.id}`}
                          className="underline text-blue-600"
                        >
                          تفاصيل
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-[#49739c] mb-1">{label}</div>
      <div className="text-[#0d141c] font-semibold break-words">
        {value || "—"}
      </div>
    </div>
  );
}

function formatDate(dt) {
  try {
    const d = new Date(dt);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("ar-EG");
  } catch {
    return "—";
  }
}
