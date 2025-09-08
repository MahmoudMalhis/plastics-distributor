// client/src/features/orders/pages/CustomerOrdersPage.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import PageHeader from "../../../components/ui/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { listOrdersByCustomer } from "../api/orders.api";
import { currency, fmtDateTime } from "../../../utils/format";

export default function CustomerOrdersPage() {
  const { customerId } = useParams();
  const cid = Number(customerId);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        if (!Number.isFinite(cid) || cid <= 0) {
          setErr("معرّف العميل غير صالح");
          return;
        }
        const res = await listOrdersByCustomer(cid, { page, limit });
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) setErr(e?.response?.data?.error || "فشل جلب الطلبات");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cid, page]);

  if (loading) return <div className="p-6">جارٍ التحميل...</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!data) return null;

  const { customer, orders, pagination } = data;

  return (
    <div dir="rtl" className="min-h-screen">
      <PageHeader title={`طلبات العميل: ${customer?.name || ""}`}>
        <Link
          to={`/customers/${customerId}`}
          className="inline-flex items-center h-11 px-4 rounded-lg bg-blue-600 text-white"
        >
          الرجوع للملف
        </Link>
      </PageHeader>

      <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
        <table className="min-w-full text-right">
          <thead className="bg-slate-100 text-[#49739c]">
            <tr>
              <th className="py-2 px-3">الكود</th>
              <th className="py-2 px-3">التاريخ</th>
              <th className="py-2 px-3">الحالة</th>
              <th className="py-2 px-3">طريقة الدفع</th>
              <th className="py-2 px-3">الإجمالي</th>
              <th className="py-2 px-3">مدفوع</th>
              <th className="py-2 px-3">المتبقي</th>
              <th className="py-2 px-3">تفاصيل الدفع</th>
              <th className="py-2 px-3">عرض</th>
            </tr>
          </thead>
          <tbody className="text-[#0d141c]">
            {orders.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="py-2 px-3 font-bold">{o.code}</td>
                <td className="py-2 px-3">{fmtDateTime(o.created_at)}</td>
                <td className="py-2 px-3">
                  <StatusBadge value={o.status} />
                </td>
                <td className="py-2 px-3">
                  {o.payment_method === "cash"
                    ? "Cash"
                    : o.payment_method === "cheque"
                    ? "Cheque"
                    : o.payment_method === "installments"
                    ? "Installments"
                    : o.payment_method}
                </td>
                <td className="py-2 px-3">{currency(o.total)}</td>
                <td className="py-2 px-3">{currency(o.total_paid || 0)}</td>
                <td className="py-2 px-3">
                  {currency(o.remaining_amount || 0)}
                </td>
                <td className="py-2 px-3 text-sm text-slate-600">
                  {o.payment_method === "installments" && o.installment_plan ? (
                    <>
                      Amount: <b>{currency(o.installment_plan.amount)}</b>
                      {" • "}
                      Period:{" "}
                      <b>
                        {o.installment_plan.period ||
                          o.installment_plan.frequency}
                      </b>
                    </>
                  ) : o.payment_method === "cheque" && o.check_note ? (
                    <>
                      Cheque note: <b>{o.check_note}</b>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-2 px-3">
                  <Link
                    to={`/orders/${o.id}`}
                    className="underline text-blue-600"
                  >
                    تفاصيل
                  </Link>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={9} className="py-6 text-center text-slate-500">
                  لا توجد طلبات
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {data?.pagination?.pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-[#49739c]">
            <button
              className="h-10 px-3 rounded-lg border border-[#cedbe8] bg-white disabled:opacity-50"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              السابق
            </button>
            <div>
              صفحة {data.pagination.page} من {data.pagination.pages}
            </div>
            <button
              className="h-10 px-3 rounded-lg border border-[#cedbe8] bg-white disabled:opacity-50"
              disabled={page >= data.pagination.pages || loading}
              onClick={() =>
                setPage((p) => Math.min(data.pagination.pages, p + 1))
              }
            >
              التالي
            </button>
          </div>
        )}
        {/* لو حاب تضيف صفحات */}
        {pagination?.pages > 1 && (
          <div className="mt-4 text-sm text-[#49739c]">
            صفحة {pagination.page} من {pagination.pages}
          </div>
        )}
      </div>
    </div>
  );
}
