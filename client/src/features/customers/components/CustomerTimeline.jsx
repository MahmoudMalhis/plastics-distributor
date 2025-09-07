// client/src/features/customers/components/CustomerTimeline.jsx
import { useEffect, useState } from "react";
import { getCustomerTimeline } from "../api/customers.api";
import { useNavigate } from "react-router-dom";

function formatCurrency(n) {
  const v = Number(n || 0);
  return v.toLocaleString("ar-EG", { style: "currency", currency: "EGP" });
}
function fmtDate(d) {
  const dt = new Date(d);
  return dt.toLocaleString("ar-EG");
}

export default function CustomerTimeline({ customerId }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function load(p = 1) {
    setLoading(true);
    try {
      const data = await getCustomerTimeline(customerId, {
        page: p,
        limit: 20,
      });
      setItems(p === 1 ? data.items : [...items, ...data.items]);
      setHasMore(!!data.hasMore);
      setPage(data.page);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(false);
    if (customerId) load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  function goToOrder(item) {
    // حدّد مسار تفاصيل الطلب حسب الدور المخزّن
    const stored = localStorage.getItem("userRole") || "";
    const role = stored.toLowerCase();
    const base = role === "admin" ? "/admin/orders" : "/distributor/orders";
    navigate(`${base}/${item.orderId}`);
  }

  return (
    <div dir="rtl" className="bg-white rounded-xl border border-slate-200">
      <div className="px-4 py-3 border-b border-slate-200 font-bold text-[#0d141c]">
        الأنشطة الأخيرة
      </div>

      {items.length === 0 && !loading && (
        <div className="p-4 text-[#49739c]">لا يوجد نشاط حتى الآن.</div>
      )}

      <ul className="divide-y divide-slate-100">
        {items.map((it) => (
          <li
            key={`${it.type}-${it.orderId || it.paymentId}-${it.ts}`}
            className="p-4"
          >
            <div className="flex items-start gap-3">
              {/* أيقونة بسيطة */}
              <div className="mt-1">
                {it.type === "order" ? (
                  <span className="material-icons text-[22px]">
                    receipt_long
                  </span>
                ) : (
                  <span className="material-icons text-[22px]">payments</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-semibold text-[#0d141c]">{it.title}</div>
                  <div className="text-xs text-[#49739c]">{fmtDate(it.ts)}</div>
                </div>

                {it.type === "order" ? (
                  <div className="text-sm text-[#0d141c] mt-1">
                    الحالة: <span className="font-semibold">{it.status}</span> —
                    الإجمالي:{" "}
                    <span className="font-semibold">
                      {formatCurrency(it.total)}
                    </span>
                  </div>
                ) : (
                  <div className="text-sm text-[#0d141c] mt-1">
                    المبلغ:{" "}
                    <span className="font-semibold">
                      {formatCurrency(it.amount)}
                    </span>
                    {it.method ? (
                      <>
                        {" "}
                        — الطريقة:{" "}
                        <span className="font-semibold">{it.method}</span>
                      </>
                    ) : null}
                    {it.reference ? (
                      <>
                        {" "}
                        — مرجع:{" "}
                        <span className="font-semibold">{it.reference}</span>
                      </>
                    ) : null}
                    {it.note ? (
                      <div className="text-[#49739c]">ملاحظة: {it.note}</div>
                    ) : null}
                  </div>
                )}

                {it.type === "order" && (
                  <div className="mt-2">
                    <button
                      onClick={() => goToOrder(it)}
                      className="px-3 h-9 rounded-lg border border-slate-300 hover:bg-slate-50 cursor-pointer text-sm"
                    >
                      فتح الفاتورة
                    </button>
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="p-3">
        {hasMore ? (
          <button
            disabled={loading}
            onClick={() => load(page + 1)}
            className="w-full h-10 rounded-lg border border-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            {loading ? "جارٍ التحميل..." : "تحميل المزيد"}
          </button>
        ) : (
          items.length > 0 && (
            <div className="text-center text-[#49739c] text-sm">
              لا مزيد من العناصر
            </div>
          )
        )}
      </div>
    </div>
  );
}
