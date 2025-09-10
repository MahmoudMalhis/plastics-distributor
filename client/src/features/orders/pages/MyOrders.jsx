// client/src/features/orders/pages/MyOrders.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { listMyOrders, listOrdersByCustomer } from "../api/orders.api";
import PageHeader from "../../../components/ui/PageHeader";
import StatusCell from "../components/StatusCell";
import { currency, fmtDateTime } from "../../../utils/format";
import AddPaymentModal from "../../payments/components/AddPaymentModal";

export default function MyOrders() {
  const { customerId } = useParams();
  const cid = Number(customerId || 0);
  const isByCustomer = Number.isFinite(cid) && cid > 0;

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customer, setCustomer] = useState(null); // لعرض اسم العميل في العنوان عند التصفية بالعميل
  const [payOpen, setPayOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(
      async () => {
        try {
          setLoading(true);
          setError("");

          if (isByCustomer) {
            // طلبات عميل محدد
            const res = await listOrdersByCustomer(cid, {
              page,
              limit: pageSize,
              status: status || undefined,
            });
            if (!cancelled) {
              setCustomer(res?.customer || null);
              setRows(res?.orders || []);
              setTotal(
                Number(
                  res?.pagination?.total || (res?.orders || []).length || 0
                )
              );
            }
          } else {
            // كل الطلبات
            const { rows, total } = await listMyOrders({
              page,
              pageSize,
              q,
              status: status || undefined,
            });
            if (!cancelled) {
              setCustomer(null);
              setRows(rows || []);
              setTotal(Number(total || 0));
            }
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
  }, [isByCustomer, cid, page, pageSize, q, status]);

  const pages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  const prettyPayment = (m) =>
    m === "cash"
      ? "نقدي"
      : m === "checks"
      ? "شيكات"
      : m === "installments"
      ? "دفعات"
      : m || "—";

  const installmentPlanPayment = (m) =>
    m === "weekly" ? "أسبوعي" : m === "monthly" ? "شهري" : m || "—";

  return (
    <>
      <PageHeader
        title={
          isByCustomer ? `طلبات العميل: ${customer?.name || ""}` : "الطلبات"
        }
      >
        {isByCustomer && (
          <button
            className="relative inline-flex items-center justify-center bg-blue-600 text-white font-bold py-2.5 px-4 sm:px-5 rounded-lg shadow-md hover:bg-blue-700 transition cursor-pointer"
            onClick={() => setPayOpen(true)}
          >
            <span className="material-icons ml-2">add</span>
            إضافة دفعة
          </button>
        )}

        <AddPaymentModal
          open={payOpen}
          onClose={() => setPayOpen(false)}
          customerId={customerId}
          onSuccess={() => {
            setPayOpen(false);
            console.log("تمت الإضافة بنجاح");
          }}
        />

        <button
          className="relative inline-flex items-center justify-center bg-blue-600 text-white font-bold py-2.5 px-4 sm:px-5 rounded-lg shadow-md hover:bg-blue-700 transition cursor-pointer"
          onClick={() =>
            navigate(isByCustomer ? `/customers/${cid}` : "/orders")
          }
        >
          <span className="material-icons">keyboard_backspace</span>
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
        {!isByCustomer && (
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
        )}

        <label
          className={`flex items-stretch rounded-lg ${
            !isByCustomer ? "" : "md:col-start-1"
          }`}
        >
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
            <option value="submitted">مرسلة</option>
            <option value="fulfilled">مكتملة</option>
            <option value="canceled">ملغاة</option>
          </select>
        </label>
      </div>

      <div className="mt-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-3 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white border border-[#cedbe8] rounded-xl overflow-x-scroll">
          <table className="w-full text-right">
            <thead className="bg-slate-100 text-[#49739c]">
              <tr>
                <th className="p-3">الكود</th>
                <th className="p-3">العميل</th>
                <th className="p-3">التاريخ</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">طريقة الدفع</th>
                <th className="p-3">الإجمالي</th>
                <th className="p-3">تفاصيل الدفع</th>
                <th className="p-3">عرض</th>
              </tr>
            </thead>
            <tbody className="text-[#0d141c]">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-[#49739c]">
                    جارٍ التحميل...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-[#49739c]">
                    لا توجد طلبات
                  </td>
                </tr>
              ) : (
                rows.map((o) => {
                  return (
                    <tr key={o.id} className="border-t border-[#eef3f7]">
                      <td className="p-3 font-bold">{o.code}</td>
                      <td className="p-3">
                        {o.customer_id ? (
                          <Link
                            to={`/customers/${o.customer_id}`}
                            className="hover:text-blue-600 hover:underline"
                          >
                            {o.customer_name || "—"}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-3">{fmtDateTime(o.created_at)}</td>
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
                        />
                      </td>
                      <td className="p-3">{prettyPayment(o.payment_method)}</td>
                      <td className="p-3">{currency(o.total)}</td>
                      <td className="p-3 text-sm text-slate-600">
                        {o.payment_method === "installments" &&
                        o.installment_plan ? (
                          <>
                            الدفعة <b>{currency(o.installment_plan.amount)}</b>
                            {" • "}
                            فترة الدفع :{" "}
                            <b>
                              {installmentPlanPayment(
                                o.installment_plan.period
                              )}
                            </b>
                          </>
                        ) : o.payment_method === "checks" && o.check_note ? (
                          <>
                            ملاحظات الشيكات: <b>{o.check_note}</b>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-3">
                        <Link
                          to={`/orders/${o.id}`}
                          className="underline text-[#0d80f2]"
                        >
                          التفاصيل
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((n) => Math.max(1, n - 1))}
            disabled={page <= 1 || loading}
            className="h-10 px-3 rounded-lg border border-[#cedbe8] bg-white disabled:opacity-50"
          >
            السابق
          </button>
          <div className="text-sm text-[#49739c]">
            صفحة {page} من {pages}
          </div>
          <button
            onClick={() => setPage((n) => Math.min(pages, n + 1))}
            disabled={page >= pages || loading}
            className="h-10 px-3 rounded-lg border border-[#cedbe8] bg-white disabled:opacity-50"
          >
            التالي
          </button>
        </div>
      </div>
    </>
  );
}
