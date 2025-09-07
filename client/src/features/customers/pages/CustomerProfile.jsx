import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getCustomer } from "../api/customers.api";
import PageHeader from "../../../components/ui/PageHeader";
import Modal from "../../../components/ui/Modal";
import StatusCell from "../../orders/components/StatusCell";
import CustomerTimeline from "../components/CustomerTimeline";
import { notify } from "../../../utils/alerts";
import { createPaymentForCustomer } from "../../payments/api/payments.api";

function nowForDatetimeLocal() {
  const d = new Date();
  // نضبط الإزاحة لأن datetime-local لا يدعم المناطق الزمنية
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  // صيغة YYYY-MM-DDTHH:mm
  return d.toISOString().slice(0, 16);
}

export default function CustomerProfile() {
  const { id } = useParams();
  const [rows, setRows] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [timelineKey, setTimelineKey] = useState(0);
  const [payOpen, setPayOpen] = useState(false);
  const [savingPay, setSavingPay] = useState(false);
  const [payForm, setPayForm] = useState({
    amount: "",
    method: "cash",
    reference: "",
    note: "",
    received_at: "",
  });

  useEffect(() => {
    if (payOpen) {
      setPayForm((f) => ({
        ...f,
        received_at: nowForDatetimeLocal(),
      }));
    }
  }, [payOpen]);

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
  const balance = Number(customer.balance || 0);

  const totalAmount = orders.reduce(
    (sum, order) => sum + Number(order.total),
    0
  );

  function formatCurrency(n) {
    const v = Number(n || 0);
    // غيّر العملة حسب الإعدادات لديك
    return `${v.toLocaleString()} ₪`;
  }

  async function submitPayment(e) {
    e.preventDefault();
    const amt = Number(payForm.amount);
    if (!(amt > 0)) {
      notify("error", "أدخل مبلغاً صحيحاً");
      return;
    }
    try {
      setSavingPay(true);
      const receivedIso = payForm.received_at
        ? new Date(payForm.received_at).toISOString()
        : null;

      await createPaymentForCustomer(Number(id), {
        amount: amt,
        method: payForm.method || "cash",
        reference: payForm.reference || null,
        note: payForm.note || null,
        received_at: receivedIso, // لو null السيرفر بيحط now
      });

      notify("success", "تم تسجيل الدفعة");

      // حدث بيانات العميل (الرصيد) وأعد تحميل التايملاين
      const fresh = await getCustomer(id);
      setCustomer(fresh);
      setTimelineKey((k) => k + 1);

      // صفّر النموذج وأغلق المودال
      setPayForm({
        amount: "",
        method: "cash",
        reference: "",
        note: "",
        received_at: "",
      });
      setPayOpen(false);
    } catch (e) {
      notify("error", e?.response?.data?.error || "فشل تسجيل الدفعة");
    } finally {
      setSavingPay(false);
    }
  }
  console.log(customer);
  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto py-5">
        <PageHeader title={`ملف : ${customer.name}`}>
          <button
            onClick={() => navigate(`/orders/customer/${customer.id}`)}
            className="inline-flex items-center gap-2 px-4 h-11 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 cursor-pointer"
          >
            <span className="material-icons">receipt_long</span>
            عرض الطلبات
          </button>
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
                <Info
                  label="الموزّع"
                  value={
                    customer?.distributor?.name ||
                    customer?.distributor_name ||
                    "—"
                  }
                />
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
                <Info label="الرصيد الحالي" value={formatCurrency(balance)} />
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
                <button
                  className="mt-6 bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer"
                  onClick={() => setPayOpen(true)}
                >
                  <span className="material-icons">add</span>
                  إضافة دفعة
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8">
          <CustomerTimeline customerId={Number(id)} key={timelineKey} />
        </div>
      </div>
      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title="إضافة دفعة"
        footer={
          <button
            type="submit"
            form="payment-form"
            disabled={savingPay}
            className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition cursor-pointer disabled:opacity-60"
          >
            {savingPay ? "جارٍ الحفظ..." : "حفظ الدفعة"}
          </button>
        }
      >
        <form
          id="payment-form"
          onSubmit={submitPayment}
          className="space-y-4"
          dir="rtl"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col">
              <span className="text-sm text-[#49739c] mb-1">المبلغ</span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={payForm.amount}
                onChange={(e) =>
                  setPayForm((f) => ({ ...f, amount: e.target.value }))
                }
                className="h-11 rounded-lg border border-[#cedbe8] bg-slate-50 px-3 focus:outline-none"
                placeholder="0.00"
              />
            </label>

            <label className="flex flex-col">
              <span className="text-sm text-[#49739c] mb-1">الطريقة</span>
              <select
                value={payForm.method}
                onChange={(e) =>
                  setPayForm((f) => ({ ...f, method: e.target.value }))
                }
                className="h-11 rounded-lg border border-[#cedbe8] bg-slate-50 px-3 focus:outline-none"
              >
                <option value="cash">نقدًا</option>
                <option value="transfer">تحويل بنكي</option>
                <option value="check">شيك</option>
              </select>
            </label>

            <label className="flex flex-col">
              <span className="text-sm text-[#49739c] mb-1">
                مرجع/رقم إيصال (اختياري)
              </span>
              <input
                value={payForm.reference}
                onChange={(e) =>
                  setPayForm((f) => ({ ...f, reference: e.target.value }))
                }
                className="h-11 rounded-lg border border-[#cedbe8] bg-slate-50 px-3 focus:outline-none"
                placeholder="رقم إيصال/مرجع"
              />
            </label>

            <label className="flex flex-col">
              <span className="text-sm text-[#49739c] mb-1">
                التاريخ والوقت (اختياري)
              </span>
              <input
                type="datetime-local"
                value={payForm.received_at}
                onChange={(e) =>
                  setPayForm((f) => ({ ...f, received_at: e.target.value }))
                }
                className="h-11 rounded-lg border border-[#cedbe8] bg-slate-50 px-3 focus:outline-none"
              />
            </label>

            <label className="flex flex-col sm:col-span-2">
              <span className="text-sm text-[#49739c] mb-1">
                ملاحظة (اختياري)
              </span>
              <textarea
                rows={3}
                value={payForm.note}
                onChange={(e) =>
                  setPayForm((f) => ({ ...f, note: e.target.value }))
                }
                className="rounded-lg border border-[#cedbe8] bg-slate-50 px-3 py-2 focus:outline-none"
                placeholder="ملاحظات حول الدفعة"
              />
            </label>
          </div>
        </form>
      </Modal>
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
