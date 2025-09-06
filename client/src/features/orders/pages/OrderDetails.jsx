// client/src/features/orders/pages/OrderDetails.jsx
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getOrder } from "../api/orders.api";
import { imageUrl } from "../../products/api/products.api";
import PageHeader from "../../../components/ui/PageHeader";
import StatusCell from "../components/StatusCell";

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getOrder(id);
        if (!cancelled) setOrder(data);
      } catch (e) {
        if (!cancelled) {
          setRows(rows || []);
          setError(e?.response?.data?.error || "تعذر تحميل تفاصيل الطلب");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => (cancelled = true);
  }, [id, rows]);

  const items = order?.items || [];

  return (
    <>
      <PageHeader title="تفاصيل الطلب">
        <button
          className="relative inline-flex items-center justify-center bg-blue-600 text-white font-bold py-2.5 px-4 sm:px-5 rounded-lg shadow-md hover:bg-blue-700 transition cursor-pointer"
          onClick={() => navigate("/orders")}
        >
          <span className="material-icons">keyboard_backspace</span>
        </button>
      </PageHeader>
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
                <Info
                  label="الحالة"
                  value={
                    <StatusCell
                      order={order}
                      onChanged={(next, updated) => {
                        // حدّث الصف محليًا؛ إن رجّع السيرفر كائن كامل، استخدمه
                        setRows((rows) =>
                          rows.map((r) =>
                            r.id === order.id
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
                  }
                />
                <Info
                  label="الإجمالي"
                  value={`${Number(order.total || 0).toLocaleString()} ₪`}
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
                        Number(it.unit_price || 0) *
                        Number(it.qty || it.qty || 0);
                      return (
                        <tr key={idx} className="border-t border-[#eef3f7]">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-16 h-12 bg-slate-100 rounded overflow-hidden">
                                {console.log(it)}
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
                            {Number(it.unit_price || 0).toLocaleString()} ₪
                          </td>
                          <td className="p-3">{Number(it.qty ?? 0)}</td>
                          <td className="p-3">{total.toLocaleString()} ₪</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
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

function formatDate(dt) {
  try {
    const d = new Date(dt);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("ar-EG");
  } catch {
    return "—";
  }
}
