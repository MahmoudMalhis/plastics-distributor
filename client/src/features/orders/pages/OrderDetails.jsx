// client/src/features/orders/pages/OrderDetails.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getOrder } from "../api/orders.api";
import { imageUrl } from "../../products/api/products.api";
import PageHeader from "../../../components/ui/PageHeader";

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        const data = await getOrder(id);
        if (!cancelled) setOrder(data);
      } catch (e) {
        if (!cancelled)
          setError(e?.response?.data?.error || "تعذر تحميل تفاصيل الطلب");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => (cancelled = true);
  }, [id]);

  const items = order?.items || order?.lines || [];

  return (
    <>
      <PageHeader title="تفاصيل الطلب"></PageHeader>
      <div className="">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-3 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white border border-[#cedbe8] rounded-xl p-6 text-[#49739c]">
            جارٍ التحميل...
          </div>
        ) : !order ? (
          <div className="bg-white border border-[#cedbe8] rounded-xl p-6 text-[#49739c]">
            الطلب غير موجود
          </div>
        ) : (
          <>
            {/* ملخص */}
            <div className="bg-white border border-[#cedbe8] rounded-xl p-4 mb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <Info label="الحالة" value={renderStatus(order.status)} />
                <Info
                  label="الإجمالي"
                  value={`${Number(
                    order.total || order.subtotal || 0
                  ).toLocaleString()} ₪`}
                />
                <Info
                  label="التاريخ"
                  value={formatDate(order.created_at || order.createdAt)}
                />
                <Info label="ملاحظات" value={order.notes || "—"} />
              </div>
            </div>

            {/* العناصر */}
            <div className="bg-white border border-[#cedbe8] rounded-xl overflow-hidden">
              <table className="w-full text-right">
                <thead className="bg-slate-100 text-[#49739c]">
                  <tr>
                    <th className="p-3">المنتج</th>
                    <th className="p-3">السعر</th>
                    <th className="p-3">الكمية</th>
                    <th className="p-3">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-6 text-center text-[#49739c]"
                      >
                        لا توجد عناصر
                      </td>
                    </tr>
                  ) : (
                    items.map((it, idx) => {
                      const total =
                        Number(it.price || 0) *
                        Number(it.qty || it.quantity || 0);
                      return (
                        <tr key={idx} className="border-t border-[#eef3f7]">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-16 h-12 bg-slate-100 rounded overflow-hidden">
                                {it.image && (
                                  <img
                                    src={imageUrl(it.image)}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <div>
                                <div className="text-[#0d141c] font-semibold">
                                  {it.name || it.product_name}
                                </div>
                                <div className="text-xs text-[#49739c]">
                                  SKU: {it.sku || "—"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            {Number(it.price || 0).toLocaleString()} ₪
                          </td>
                          <td className="p-3">
                            {Number(it.qty ?? it.quantity ?? 0)}
                          </td>
                          <td className="p-3">{total.toLocaleString()} ₪</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-4">
              <Link to="/orders" className="underline text-[#0d80f2]">
                العودة لقائمة الطلبات
              </Link>
              <Link
                to="/distributor/catalog"
                className="underline text-[#0d80f2]"
              >
                العودة للكتالوج
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-[#49739c] mb-1">{label}</div>
      <div className="text-[#0d141c] font-semibold">{value}</div>
    </div>
  );
}

function renderStatus(s) {
  const map = {
    pending: "قيد المراجعة",
    confirmed: "مؤكد",
    shipped: "تم الشحن",
    completed: "مكتمل",
    cancelled: "ملغي",
  };
  return map[s] || s || "—";
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
