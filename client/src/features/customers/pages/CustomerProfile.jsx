import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getCustomer } from "../api/customers.api";
import PageHeader from "../../../components/ui/PageHeader";
import CustomerTimeline from "../components/CustomerTimeline";
import { currency } from "../../../utils/format";
import AddPaymentModal from "../../payments/components/AddPaymentModal";

export default function CustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // UI state
  const [timelineKey, setTimelineKey] = useState(0);
  const [payOpen, setPayOpen] = useState(false);

  async function loadCustomer() {
    try {
      setLoading(true);
      setError("");
      const data = await getCustomer(id);
      setCustomer(data);
    } catch (e) {
      setError(e?.response?.data?.error || "تعذر تحميل بيانات العميل");
    } finally {
      setLoading(false);
    }
  }

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

  const balance = Number(customer.balance || 0);

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
                  className={`text-lg font-medium px-3 py-1 rounded-full inline-block \
                    ${
                      customer.active
                        ? "text-green-600 bg-green-100"
                        : "text-red-600 bg-red-100"
                    }`}
                />
                <Info label="الرصيد الحالي" value={currency(balance)} />
                <Info
                  label="عدد الطلبات"
                  value={
                    customer?.ordersCount ?? customer?.orders?.length ?? "—"
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

          {/* الرصيد والدفعات */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 h-full">
              <h2 className="text-xl font-semibold text-gray-700 mb-6 border-b pb-4">
                الرصيد المالي
              </h2>
              <div className="flex flex-col items-center justify-center h-full -mt-10">
                <div className="text-4xl font-bold text-gray-800">
                  {currency(balance)}
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

        {/* المودال */}
        <AddPaymentModal
          open={payOpen}
          onClose={() => setPayOpen(false)}
          customerId={customer.id}
          onSuccess={async () => {
            setPayOpen(false);
            await loadCustomer();
            setTimelineKey((k) => k + 1);
          }}
        />

        <div className="mt-8">
          <CustomerTimeline customerId={Number(id)} key={timelineKey} />
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
