import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../../components/ui/PageHeader";
import DataTable from "../../../components/ui/DataTable";
import Modal from "../../../components/ui/Modal";
import { notify } from "../../../utils/alerts";
import {
  listCustomers,
  createCustomer,
  updateCustomer,
} from "../api/customers.api";
import CustomerForm from "../components/CustomerForm";
import { Link, useNavigate } from "react-router-dom";

export default function CustomersList() {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    id: null,
    name: "",
    phone: "",
    address: "",
    notes: "",
    customer_sku: "",
  });

  // جلب العملاء عند تغيير البحث أو الصفحة
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(
      () => {
        (async () => {
          try {
            setLoading(true);
            setError("");
            const { rows, total } = await listCustomers({
              search,
              page,
              limit,
            });
            if (!cancelled) {
              setItems(rows || []);
              setTotal(Number(total || 0));
            }
          } catch (e) {
            if (!cancelled)
              setError(e?.response?.data?.error || "فشل جلب العملاء");
          } finally {
            if (!cancelled) setLoading(false);
          }
        })();
      },
      search ? 350 : 0
    );
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search, page, limit]);

  const pages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

  function openCreate() {
    setForm({
      id: null,
      name: "",
      phone: "",
      address: "",
      notes: "",
      customer_sku: "",
    });
    setOpen(true);
  }

  function openEdit(cust) {
    setForm({
      id: cust.id,
      name: cust.name || "",
      phone: cust.phone || "",
      address: cust.address || "",
      notes: cust.notes || "",
      customer_sku: cust.customer_sku || "",
    });
    setOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const name = (form.name || "").trim();
    if (!name) return;
    setSaving(true);
    setError("");
    try {
      if (form.id) {
        const data = await updateCustomer(form.id, {
          name: form.name,
          phone: form.phone,
          address: form.address,
          notes: form.notes,
        });
        setItems((prev) => prev.map((c) => (c.id === form.id ? data : c)));
      } else {
        const data = await createCustomer({
          name: form.name,
          phone: form.phone,
          address: form.address,
          notes: form.notes,
        });
        setItems((prev) => [...prev, data]);
      }
      setOpen(false);
      notify("success", "تم الحفظ بنجاح");
    } catch (e) {
      setError(e?.response?.data?.error || "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(cust) {
    try {
      const next = !cust.active;
      const data = await updateCustomer(cust.id, { active: next });
      setItems((prev) => prev.map((c) => (c.id === cust.id ? data : c)));
      notify("success", next ? "تم تفعيل العميل" : "تم إيقاف العميل");
    } catch (e) {
      notify("error", e?.response?.data?.error || "فشل تحديث الحالة");
    }
  }

  return (
    <div dir="rtl">
      <PageHeader title="العملاء">
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center bg-blue-600 text-white font-semibold h-11 px-4 rounded-lg shadow hover:bg-blue-700 cursor-pointer"
        >
          <span className="material-icons ml-2">add</span>
          عميل جديد
        </button>
      </PageHeader>

      {/* شريط البحث */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 px-4 mt-2">
          <label className="flex items-stretch rounded-lg flex-1">
            <div className="text-[#49739c] flex border border-[#cedbe8] bg-slate-50 items-center justify-center pr-[15px] rounded-r-lg border-l-0 px-2">
              بحث
            </div>
            <input
              dir="rtl"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="ابحث بالاسم أو الكود"
              className="flex w-full min-w-0 flex-1 rounded-lg text-[#0d141c] border border-[#cedbe8] bg-slate-50 h-12 p-[12px] rounded-r-none border-r-0 pr-2 text-base focus:outline-none"
            />
          </label>
        </div>
      </div>

      {/* جدول */}
      <div className="mt-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-3 text-sm">
            {error}
          </div>
        )}
        <DataTable
          head={[
            { label: "#", className: "text-right w-16" },
            { label: "الاسم", className: "text-right" },
            { label: "الكود", className: "text-right" },
            { label: "الهاتف", className: "text-right" },
            { label: "الرصيد", className: "text-right" },
            { label: "عدد الطلبات", className: "text-right" },
            { label: "الحالة", className: "text-center" },
            { label: "إجراء", className: "text-center" },
          ]}
        >
          {loading ? (
            <tr>
              <td colSpan={8} className="p-6 text-center text-[#49739c]">
                جارٍ التحميل...
              </td>
            </tr>
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={8} className="p-6 text-center text-[#49739c]">
                لا توجد نتائج
              </td>
            </tr>
          ) : (
            items.map((cust, idx) => (
              <tr key={cust.id} className="border-t border-[#eef3f7]">
                <td className="p-3">{(page - 1) * limit + idx + 1}</td>
                <td className="p-3">{cust.name}</td>
                <td className="p-3">{cust.customer_sku}</td>
                <td className="p-3">{cust.phone || "—"}</td>
                <td className="p-3">
                  {Number(cust.balance || 0).toLocaleString()} ₪
                </td>
                <td className="p-3">
                  {cust.ordersCount != null
                    ? cust.ordersCount
                    : cust.orders_count || 0}
                </td>
                <td className="p-3 text-center">
                  {cust.active ? (
                    <span className="text-green-600">نشط</span>
                  ) : (
                    <span className="text-red-600">موقوف</span>
                  )}
                </td>
                <td className="p-3 text-center flex justify-center gap-3">
                  <button
                    onClick={() => navigate(`/customers/${cust.id}`)}
                    className="inline-flex items-center justify-center transition shadow-sm cursor-pointer
                                rounded-full
                                 bg-blue-100 text-blue-600 hover:bg-blue-200
                                w-9 h-9 text-[20px]"
                  >
                    <span className="material-icons">info</span>
                  </button>
                  <button
                    onClick={() => openEdit(cust)}
                    className="inline-flex items-center justify-center transition shadow-sm cursor-pointer
                                rounded-full
                               
                                 bg-yellow-100 text-yellow-600 hover:bg-yellow-200
                                w-9 h-9 text-[20px]
                                "
                  >
                    <span className="material-icons">edit</span>
                  </button>
                  <button
                    title={cust.active ? "تعطيل العميل" : "تفعيل العميل"}
                    onClick={() => toggleActive(cust)}
                    className={`inline-flex items-center justify-center transition shadow-sm cursor-pointer
                                rounded-full w-9 h-9 text-[20px]
                                ${
                                  cust.active
                                    ? "text-green-600 bg-green-100 hover:bg-green-200"
                                    : "text-red-600 bg-red-100 hover:bg-red-200"
                                }`}
                  >
                    <span className="material-icons">
                      {cust.active ? "toggle_off" : "toggle_on"}
                    </span>
                  </button>
                </td>
              </tr>
            ))
          )}
        </DataTable>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="h-10 px-3 rounded-lg border border-[#cedbe8] bg-white disabled:opacity-50"
          >
            السابق
          </button>
          <div className="text-sm text-[#49739c]">
            صفحة {page} من {pages}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages || loading}
            className="h-10 px-3 rounded-lg border border-[#cedbe8] bg-white disabled:opacity-50"
          >
            التالي
          </button>
        </div>
      </div>

      {/* Modal لإضافة/تعديل عميل */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? "تعديل عميل" : "إضافة عميل"}
        footer={
          <>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 h-11 rounded-lg border border-gray-300 hover:bg-gray-50 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              form="customer-form"
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 h-11 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-60 cursor-pointer"
            >
              <span className="material-icons text-[18px]">
                {saving ? "hourglass_top" : "save"}
              </span>
              {saving ? "جارٍ الحفظ..." : "حفظ"}
            </button>
          </>
        }
      >
        <form
          id="customer-form"
          onSubmit={handleSubmit}
          className="space-y-4"
          dir="rtl"
        >
          <CustomerForm form={form} setForm={setForm} error={error} />
        </form>
      </Modal>
    </div>
  );
}
