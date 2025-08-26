// src/features/categories/pages/AdminCategories.jsx
import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../../components/ui/PageHeader";
import DataTable from "../../../components/ui/DataTable";
import Modal from "../../../components/ui/Modal";
import { notify } from "../../../utils/alerts";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../api/categories.api";
import CategoryFilters from "../components/CategoryFilters";
import CategoryRow from "../components/CategoryRow";

export default function AdminCategories() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ id: null, name: "" });

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const rows = await listCategories();
      setItems(rows);
    } catch (e) {
      setErr(e?.response?.data?.error || "فشل جلب التصنيفات");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = (q || "").trim();
    if (!s) return items;
    return items.filter((c) =>
      String(c.name || "")
        .toLowerCase()
        .includes(s.toLowerCase())
    );
  }, [q, items]);

  function openCreate() {
    setForm({ id: null, name: "" });
    setOpen(true);
  }

  function openEdit(cat) {
    setForm({ id: cat.id, name: cat.name || "" });
    setOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const name = (form.name || "").trim();
    if (!name) return;
    setSaving(true);
    setErr("");
    try {
      if (form.id) {
        const data = await updateCategory(form.id, { name });
        setItems((prev) =>
          prev
            .map((c) => (c.id === form.id ? data : c))
            .sort((a, b) => a.name.localeCompare(b.name, "ar"))
        );
      } else {
        const data = await createCategory({ name });
        setItems((prev) =>
          [...prev, data].sort((a, b) => a.name.localeCompare(b.name, "ar"))
        );
      }
      setOpen(false);
      notify("success", "تم الحفظ بنجاح");
    } catch (e) {
      setErr(e?.response?.data?.error || "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteCategory(id);
      setItems((prev) => prev.filter((c) => c.id !== id));
      notify("success", "تم حذف التصنيف بنجاح");
    } catch (e) {
      notify("warning", "تعذر حذف التصنيف. قد يكون مرتبطًا بمنتجات.");
    }
  }

  return (
    <div dir="rtl">
      <PageHeader title="التصنيفات">
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center bg-blue-600 text-white font-semibold h-11 px-4 rounded-lg shadow hover:bg-blue-700 cursor-pointer"
        >
          <span className="material-icons ml-2">add</span>
          تصنيف جديد
        </button>
      </PageHeader>

      <CategoryFilters q={q} setQ={setQ} />

      <DataTable
        head={[
          { label: "#", className: "text-right w-16" },
          { label: "الاسم", className: "text-right" },
          { label: "الإجراءات", className: "text-center w-56 sm:w-64" },
        ]}
      >
        {loading ? (
          <tr>
            <td className="p-4" colSpan={3}>
              جاري التحميل...
            </td>
          </tr>
        ) : err ? (
          <tr>
            <td className="p-4 text-red-600" colSpan={3}>
              {err}
            </td>
          </tr>
        ) : filtered.length === 0 ? (
          <tr>
            <td className="p-4" colSpan={3}>
              لا توجد تصنيفات
            </td>
          </tr>
        ) : (
          filtered.map((c, idx) => (
            <CategoryRow
              key={c.id}
              index={idx}
              category={c}
              onEdit={() => openEdit(c)}
              onDelete={() => handleDelete(c.id)}
            />
          ))
        )}
      </DataTable>

      <Modal
        open={open}
        title={form.id ? "تعديل تصنيف" : "إضافة تصنيف"}
        onClose={() => setOpen(false)}
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
              form="category-form"
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
          id="category-form"
          onSubmit={handleSubmit}
          className="space-y-4"
          dir="rtl"
        >
          <label className="block mb-1 text-sm font-medium text-gray-700">
            اسم التصنيف <span className="text-rose-500">*</span>
          </label>
          <input
            className="w-full h-11 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            placeholder="مثل: عبوات / مواد خام / أدوات..."
            required
            autoFocus
          />
          {err && <div className="text-rose-600 text-sm">{err}</div>}
        </form>
      </Modal>
    </div>
  );
}
