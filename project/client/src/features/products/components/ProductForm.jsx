// src/features/products/components/ProductForm.jsx
import { useMemo } from "react";
import Field from "../../../components/ui/Field";
import CategorySelect from "../../../components/ui/CategorySelect";
import ImageUpload from "../../../components/ui/ImageUpload";
import { imageUrl } from "../../../utils/format";

/** حدود الصورة */
const MAX_MB = 2;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export default function ProductForm({
  form,
  setForm,
  file,
  setFile,
  categories,
  setCategories,
  err,
  onSubmit,
  existingImage, // مسار الصورة الحالية عند التعديل (اختياري)
}) {
  const existingSrc = useMemo(
    () => (existingImage ? imageUrl(existingImage) : ""),
    [existingImage]
  );

  function onFileChange(f) {
    if (!f) return setFile(null);
    if (!ACCEPTED.includes(f.type)) {
      alert("نوع الصورة غير مدعوم. الأنواع المسموحة: JPG/PNG/WEBP");
      return;
    }
    const mb = f.size / (1024 * 1024);
    if (mb > MAX_MB) {
      alert(`حجم الصورة كبير (${mb.toFixed(2)}MB). الحد الأقصى ${MAX_MB}MB`);
      return;
    }
    setFile(f);
  }

  return (
    <form
      id="product-form"
      onSubmit={onSubmit}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
      dir="rtl"
    >
      <Field label="الاسم" required>
        <input
          className="w-full h-11 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.name}
          onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
          required
        />
      </Field>

      <Field
        label="SKU (اختياري)"
        hint="اتركه فارغًا ليتولد تلقائيًا من السيرفر"
      >
        <input
          className="w-full h-11 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.sku}
          onChange={(e) => setForm((s) => ({ ...s, sku: e.target.value }))}
          placeholder="مثال: PRD-000123"
        />
      </Field>

      <Field label="السعر">
        <input
          type="number"
          step="0.01"
          className="w-full h-11 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.price}
          onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))}
        />
      </Field>

      <Field label="الوحدة" hint="مثل: كرتونة، حبة، درزن...">
        <input
          className="w-full h-11 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.unit}
          onChange={(e) => setForm((s) => ({ ...s, unit: e.target.value }))}
        />
      </Field>

      <Field label="التصنيف" required>
        <CategorySelect
          value={form.category_id}
          onChange={(id) => setForm((s) => ({ ...s, category_id: id }))}
          categories={categories}
          setCategories={setCategories}
          allowCreate
        />
      </Field>

      <Field label="الوصف (اختياري)">
        <textarea
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.description}
          onChange={(e) =>
            setForm((s) => ({ ...s, description: e.target.value }))
          }
        />
      </Field>

      <div className="md:col-span-2">
        <Field label="الصورة (اختياري)">
          <ImageUpload file={file} onFileChange={onFileChange} />
          {/* معاينة للصورة الحالية عند التعديل (إن لم يرفع المستخدم ملفًا جديدًا) */}
          {!file && existingSrc && (
            <div className="mt-3">
              <img
                src={existingSrc}
                alt="current"
                className="w-28 h-28 object-cover rounded-md border"
              />
            </div>
          )}
        </Field>
      </div>

      {err && <div className="md:col-span-2 text-rose-600 text-sm">{err}</div>}
    </form>
  );
}
