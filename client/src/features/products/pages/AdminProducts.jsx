// src/features/products/pages/AdminProducts.jsx
import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../../components/ui/PageHeader";
import Modal from "../../../components/ui/Modal";
import DataTable from "../../../components/ui/DataTable";
import { dialog, notify } from "../../../utils/alerts";
import useDebouncedValue from "../../../hooks/useDebouncedValue";
import {
  listProducts,
  createProduct,
  updateProduct,
  uploadProductImage,
  archiveProduct,
  restoreProduct,
} from "../api/products.api";
import ProductFilters from "../components/ProductFilters";
import ProductRow from "../components/ProductRow";
import ProductForm from "../components/ProductForm";
import { api } from "../../../lib/api";

export default function AdminProducts() {
  const [categories, setCategories] = useState([]);
  const [catId, setCatId] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [includeArchived, setIncludeArchived] = useState(false);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    id: null,
    name: "",
    sku: "",
    price: "",
    unit: "قطعة",
    category_id: "",
    description: "",
  });

  const catMap = useMemo(() => {
    const m = {};
    for (const c of categories) m[c.id] = c.name;
    return m;
  }, [categories]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/api/categories");
        setCategories(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to fetch categories:", e);
      }
    })();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    setErr("");
    try {
      const rows = await listProducts({
        search: debouncedSearch || undefined,
        categoryId: catId || undefined,
        includeArchived: includeArchived ? "true" : undefined,
      });
      setItems(rows);
    } catch (e) {
      setErr(e?.response?.data?.error || "فشل في جلب المنتجات");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catId, includeArchived, debouncedSearch]);

  function openCreate() {
    setForm({
      id: null,
      name: "",
      sku: "",
      price: "",
      unit: "قطعة",
      category_id: "",
      description: "",
    });
    setFile(null);
    setOpen(true);
  }
  function openEdit(p) {
    setForm({
      id: p.id,
      name: p.name || "",
      sku: p.sku || "",
      price: p.price ?? "",
      unit: p.unit || "قطعة",
      category_id: p.category_id || "",
      description: p.description || "",
    });
    setFile(null);
    setOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setErr("");
    try {
      if (!form.name || !form.category_id || !form.unit) {
        setErr("الاسم، التصنيف، الوحدة مطلوبة");
        setSaving(false);
        return;
      }
      let productId = form.id;

      if (productId) {
        await updateProduct(productId, {
          name: form.name,
          sku: form.sku || undefined,
          price: form.price === "" ? null : Number(form.price),
          unit: form.unit,
          category_id: Number(form.category_id),
          description: form.description || null,
        });
      } else {
        const data = await createProduct({
          name: form.name,
          sku: form.sku || undefined,
          price: form.price === "" ? null : Number(form.price),
          unit: form.unit,
          category_id: Number(form.category_id),
          description: form.description || null,
        });
        productId = data?.id || data?.product?.id;
      }

      if (file && productId) {
        await uploadProductImage(productId, file);
      }

      setOpen(false);
      setFile(null);
      await fetchProducts();
      notify("success", "تم الحفظ بنجاح");
    } catch (e) {
      setErr(e?.response?.data?.error || "فشل حفظ المنتج");
    } finally {
      setSaving(false);
    }
  }

  async function archive(id) {
    const ok = await dialog({
      title: "تأكيد أرشفة المنتج",
      text: "سيختفي المنتج عن المورّدين.",
      icon: "warning",
      confirmText: "أرشفة",
      cancelText: "إلغاء",
    });
    if (!ok) return;
    try {
      await archiveProduct(id);
      await fetchProducts();
      notify("success", "تم أرشفة المنتج بنجاح");
    } catch (e) {
      notify("error", e?.response?.data?.error || "فشل الأرشفة");
    }
  }

  async function restore(id) {
    const ok = await dialog({
      title: "تأكيد استرجاع المنتج",
      text: "سيعود المنتج للظهور في قائمة المنتجات.",
      icon: "question",
      confirmText: "استرجاع",
      cancelText: "إلغاء",
    });
    if (!ok) return;
    try {
      await restoreProduct(id);
      await fetchProducts();
      notify("success", "تم استرجاع المنتج بنجاح");
    } catch (e) {
      notify("error", e?.response?.data?.error || "فشل الاسترجاع");
    }
  }

  return (
    <>
      <PageHeader title="إدارة المنتجات">
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center bg-blue-600 text-white font-bold py-2.5 px-4 sm:px-5 rounded-lg shadow-md hover:bg-blue-700 transition cursor-pointer"
        >
          <span className="material-icons ml-2 sm:ml-3 text-base sm:text-[20px]">
            add
          </span>
          منتج جديد
        </button>
      </PageHeader>

      <ProductFilters
        search={search}
        setSearch={setSearch}
        catId={catId}
        setCatId={setCatId}
        includeArchived={includeArchived}
        setIncludeArchived={setIncludeArchived}
        categories={categories}
        setCategories={setCategories}
      />

      <DataTable
        head={[
          { label: "الصورة", className: "text-right whitespace-nowrap" },
          { label: "الاسم", className: "text-right" },
          { label: "SKU", className: "text-right" },
          { label: "السعر/الوحدة", className: "text-right whitespace-nowrap" },
          { label: "التصنيف", className: "text-right" },
          { label: "الحالة", className: "text-center" },
          { label: "الإجراءات", className: "text-center" },
        ]}
      >
        {loading ? (
          <tr>
            <td className="p-4" colSpan={7}>
              جاري التحميل...
            </td>
          </tr>
        ) : err ? (
          <tr>
            <td className="p-4 text-red-600" colSpan={7}>
              {err}
            </td>
          </tr>
        ) : items.length === 0 ? (
          <tr>
            <td className="p-4" colSpan={7}>
              لا توجد نتائج
            </td>
          </tr>
        ) : (
          items.map((p) => (
            <ProductRow
              key={p.id}
              product={p}
              catMap={catMap}
              onEdit={() => openEdit(p)}
              onArchive={() => archive(p.id)}
              onRestore={() => restore(p.id)}
            />
          ))
        )}
      </DataTable>

      <Modal
        open={open}
        title={form.id ? "تعديل منتج" : "إضافة منتج"}
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
              form="product-form"
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
        <ProductForm
          form={form}
          setForm={setForm}
          file={file}
          setFile={setFile}
          categories={categories}
          setCategories={setCategories}
          err={err}
          onSubmit={handleSave}
          existingImage={
            form.id
              ? items.find((i) => i.id === form.id)?.image_url ||
                items.find((i) => i.id === form.id)?.thumb_url ||
                ""
              : ""
          }
        />
      </Modal>
    </>
  );
}
