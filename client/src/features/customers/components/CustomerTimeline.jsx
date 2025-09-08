// client/src/features/customers/components/CustomerTimeline.jsx
import { useEffect, useState } from "react";
import { getCustomerTimeline } from "../api/customers.api";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../../orders/components/StatusBadge";
import { currency, fmtDateTime } from "../../../utils/format";

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
            <div className="flex justify-between items-center gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-full flex justify-center items-center w-10 h-10 bg-blue-100">
                  {it.type === "order" ? (
                    <span className="material-icons text-[22px] text-blue-600">
                      receipt_long
                    </span>
                  ) : (
                    <span className="material-icons text-[22px]">payments</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold text-[#0d141c]">
                      {it.title}
                    </div>
                  </div>

                  {it.type === "order" ? (
                    <div className="text-sm text-[#0d141c] mt-1">
                      <div>
                        الحالة:
                        <span className="font-semibold mr-1">
                          {<StatusBadge value={it.status} />}
                        </span>
                      </div>
                      <div>
                        قيمة الفاتورة:
                        <span className="font-semibold mr-1">
                          {currency(it.total)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-[#0d141c] mt-1">
                      المبلغ:
                      <span className="font-semibold">
                        {currency(it.amount)}
                      </span>
                      {it.method ? (
                        <>
                          — الطريقة:
                          <span className="font-semibold">{it.method}</span>
                        </>
                      ) : null}
                      {it.reference ? (
                        <>
                          — مرجع:
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
                        onClick={() => navigate(`/orders/${it.orderId}`)}
                        className="px-3 h-9 rounded-lg hover:bg-blue-50 cursor-pointer text-sm text-blue-600"
                      >
                        عرض التفاصبل
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-xs text-[#49739c]">{fmtDateTime(it.ts)}</div>
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
            <div className="text-center text-blue-600 text-sm">
              لا مزيد من العناصر
            </div>
          )
        )}
      </div>
    </div>
  );
}
