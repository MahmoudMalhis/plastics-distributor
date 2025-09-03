import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getCustomer } from "../api/customers.api";
import PageHeader from "../../../components/ui/PageHeader";
import StatusCell from "../../orders/components/StatusCell";

export default function CustomerProfile() {
  const { id } = useParams();
  const [rows, setRows] = useState([]);
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
        if (!cancelled) {
          setRows(rows || []);
          setCustomer(data);
        }
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
  }, [id, rows]);

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

  const totalAmount = orders.reduce(
    (sum, order) => sum + Number(order.total),
    0
  );

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto py-5">
        <PageHeader title={`ملف : ${customer.name}`}>
          <button
            className="relative inline-flex items-center justify-center bg-blue-600 text-white font-bold py-2.5 px-4 sm:px-5 rounded-lg shadow-md hover:bg-blue-700 transition cursor-pointer"
            onClick={() => navigate("/customers")}
          >
            <span className="material-icons">keyboard_backspace</span>
          </button>
        </PageHeader>
        {/* بيانات العميل */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-700 mb-6 border-b pb-4">
                البيانات الأساسية
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <Info label="الاسم" value={customer.name} />
                <Info label="الكود" value={customer.customer_sku} />
                <Info label="الهاتف" value={customer.phone || "—"} />
                <Info label="العنوان" value={customer.address || "—"} />
                <Info label="الملاحظات" value={customer.notes || "—"} />
                <Info
                  label="الحالة"
                  value={customer.active ? "نشط" : "موقوف"}
                  className={`text-lg font-medium px-3 py-1 rounded-full inline-block 
                    ${
                      customer.active
                        ? "text-green-600 bg-green-100"
                        : "text-red-600 bg-red-100"
                    }`}
                />
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
                      <button
                        onClick={() => {
                          const lat = customer.latitude;
                          const lng = customer.longitude;
                          const url = `https://www.google.com/maps?q=${lat},${lng}&z=17`;
                          window.open(url, "_blank");
                        }}
                        className="flex items-center gap-2 bg-blue-100 text-blue-700 font-semibold py-2 px-4 rounded-lg hover:bg-blue-200 transition-colors cursor-pointer"
                      >
                        <span className="material-icons">location_on</span>
                        فتح الخريطة
                      </button>
                    ) : (
                      "—"
                    )
                  }
                />
              </div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 h-full">
              <h2 className="text-xl font-semibold text-gray-700 mb-6 border-b pb-4">
                الرصيد المالي
              </h2>
              <div className="flex flex-col items-center justify-center h-full -mt-10">
                <div className="text-4xl font-bold text-gray-800">
                  {totalAmount} ₪
                </div>
                <p className="text-gray-500 mt-2">الرصيد الحالي</p>
                <button className="mt-6 bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer">
                  <span className="material-icons">add</span>
                  إضافة دفعة
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* قائمة الطلبات */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
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
                      <td className="py-2 px-4">
                        <StatusCell
                          order={o}
                          onChanged={(next, updated) => {
                            setRows((rows) =>
                              rows.map((r) =>
                                r.id === o.id
                                  ? {
                                      ...r,
                                      status: next,
                                      ...(updated?.order || {}),
                                    }
                                  : r
                              )
                            );
                          }}
                          // askReason={true}  // فعّلها لو بدك prompt لسبب التغيير
                        />
                      </td>
                      <td className="py-2 px-4">
                        {Number(o.total).toLocaleString()} ₪
                      </td>
                      <td className="py-2 px-4">
                        <Link
                          to={`/orders/${o.id}`}
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

function Info({ label, value, className }) {
  return (
    <div>
      <div className="text-[#49739c] mb-1">{label}</div>
      <div className={`${className} text-[#0d141c] font-semibold break-words`}>
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
