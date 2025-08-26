// client/src/features/orders/pages/MyOrders.jsx
import { useEffect, useMemo, useState } from "react";
import { listMyOrders } from "../api/orders.api";
import { Link } from "react-router-dom";
import PageHeader from "../../../components/ui/PageHeader";

export default function MyOrders() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const Title = ({ children }) => (
    <h2 className="text-[#0d141c] text-[28px] font-bold leading-tight px-4 text-center pb-3 pt-5">
      {children}
    </h2>
  );

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(
      async () => {
        try {
          setLoading(true);
          setError("");
          const { rows, total } = await listMyOrders({
            page,
            pageSize,
            q,
            status,
          });
          if (!cancelled) {
            setRows(rows || []);
            setTotal(Number(total || 0));
          }
        } catch (e) {
          if (!cancelled)
            setError(e?.response?.data?.error || "تعذر تحميل الطلبات");
        } finally {
          if (!cancelled) setLoading(false);
        }
      },
      q ? 350 : 0
    );

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [page, pageSize, q, status]);

  const pages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  return (
    <>
      <PageHeader title="طلباتي"></PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
        <label className="flex items-stretch rounded-lg col-span-2">
          <div className="text-[#49739c] flex border border-[#cedbe8] bg-slate-50 items-center justify-center pr-[15px] rounded-r-lg border-l-0 px-2">
            بحث
          </div>
          <input
            dir="rtl"
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            placeholder="ابحث برقم الطلب أو الملاحظات"
            className="flex w-full min-w-0 flex-1 rounded-lg text-[#0d141c] border border-[#cedbe8] bg-slate-50 h-12 p-[12px] rounded-r-none border-r-0 pr-2 text-base focus:outline-none"
          />
        </label>

        <label className="flex items-stretch rounded-lg">
          <div className="text-[#49739c] flex border border-[#cedbe8] bg-slate-50 items-center justify-center pr-[15px] rounded-r-lg border-l-0 px-2">
            الحالة
          </div>
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className="flex w-full min-w-0 flex-1 rounded-lg text-[#0d141c] border border-[#cedbe8] bg-slate-50 h-12 p-[12px] rounded-r-none border-r-0 pr-2 text-base focus:outline-none"
          >
            <option value="">الكل</option>
            <option value="pending">قيد المراجعة</option>
            <option value="confirmed">مؤكد</option>
            <option value="shipped">تم الشحن</option>
            <option value="completed">مكتمل</option>
            <option value="cancelled">ملغي</option>
          </select>
        </label>
      </div>

      <div className="mt-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-3 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white border border-[#cedbe8] rounded-xl overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-slate-100 text-[#49739c]">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">التاريخ</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">الإجمالي</th>
                <th className="p-3">تفاصيل</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-[#49739c]">
                    جارٍ التحميل...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-[#49739c]">
                    لا توجد طلبات
                  </td>
                </tr>
              ) : (
                rows.map((o) => (
                  <tr key={o.id} className="border-t border-[#eef3f7]">
                    <td className="p-3">{o.id}</td>
                    <td className="p-3">
                      {formatDate(o.created_at || o.createdAt)}
                    </td>
                    <td className="p-3">{renderStatus(o.status)}</td>
                    <td className="p-3">
                      {Number(o.total || o.subtotal || 0).toLocaleString()} ₪
                    </td>
                    <td className="p-3">
                      <Link
                        to={`/orders/${o.id}`}
                        className="underline text-[#0d80f2]"
                      >
                        عرض
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((n) => Math.max(1, n - 1))}
            disabled={page <= 1 || loading}
            className="h-10 px-3 rounded-lg border border-[#cedbe8] bg-white disabled:opacity-50"
          >
            السابق
          </button>
          <div className="text-sm text-[#49739c]">
            صفحة {page} من {Math.max(1, Math.ceil(total / pageSize))}
          </div>
          <button
            onClick={() =>
              setPage((n) =>
                Math.min(Math.max(1, Math.ceil(total / pageSize)), n + 1)
              )
            }
            disabled={
              page >= Math.max(1, Math.ceil(total / pageSize)) || loading
            }
            className="h-10 px-3 rounded-lg border border-[#cedbe8] bg-white disabled:opacity-50"
          >
            التالي
          </button>
        </div>
      </div>
    </>
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
