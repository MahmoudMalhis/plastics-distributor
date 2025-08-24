// src/features/products/components/ProductForm.jsx
import { useMemo } from "react";
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
      className="grid grid-cols-1 md:grid-cols-3 gap-8"
      dir="rtl"
    >
      {/* Left section: form fields split into groups */}
      <div className="md:col-span-2 space-y-6">
        {/* Group 1: name & SKU */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-2"
              htmlFor="name"
            >
              الاسم <span className="text-rose-500">*</span>
            </label>
            <input
              id="name"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300"
              type="text"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-2"
              htmlFor="sku"
            >
              SKU (اختياري)
            </label>
            <input
              id="sku"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300"
              type="text"
              value={form.sku}
              onChange={(e) => setForm((s) => ({ ...s, sku: e.target.value }))}
              placeholder="مثال: PRD-000123"
            />
            <p className="text-xs text-gray-500 mt-1">
              اتركه فارغاً ليتولد تلقائياً من السيرفر
            </p>
          </div>
        </div>

        {/* Group 2: price & unit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-2"
              htmlFor="price"
            >
              السعر
            </label>
            <input
              id="price"
              type="number"
              step="0.01"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300"
              value={form.price}
              onChange={(e) =>
                setForm((s) => ({ ...s, price: e.target.value }))
              }
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-2"
              htmlFor="unit"
            >
              الوحدة
            </label>
            <input
              id="unit"
              type="text"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300"
              value={form.unit}
              onChange={(e) => setForm((s) => ({ ...s, unit: e.target.value }))}
            />
            <p className="text-xs text-gray-500 mt-1">
              مثل: كرتونة، حبة، درزن...
            </p>
          </div>
        </div>

        {/* Group 3: category & description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-2"
              htmlFor="category"
            >
              التصنيف <span className="text-rose-500">*</span>
            </label>
            {/* Use CategorySelect for selecting categories */}
            <CategorySelect
              value={form.category_id}
              onChange={(id) => setForm((s) => ({ ...s, category_id: id }))}
              categories={categories}
              setCategories={setCategories}
              allowCreate
            />
          </div>
          <div className="md:row-span-2">
            <label
              className="block text-sm font-medium text-gray-700 mb-2"
              htmlFor="description"
            >
              الوصف (اختياري)
            </label>
            <textarea
              id="description"
              rows={7}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300"
              value={form.description}
              onChange={(e) =>
                setForm((s) => ({ ...s, description: e.target.value }))
              }
            />
          </div>
        </div>
      </div>

      {/* Right section: image upload and preview */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            الصورة (اختياري)
          </label>
          <ImageUpload
            file={file}
            onFileChange={onFileChange}
            hidePreview={true}
          />
        </div>
        <div className="flex justify-center">
          <div className="w-40 h-40 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
            {/* Show preview: uploaded file takes precedence, otherwise existing image */}
            {file ? (
              <img
                src={URL.createObjectURL(file)}
                alt="preview"
                className="w-full h-full object-cover"
              />
            ) : existingSrc ? (
              <img
                src={existingSrc}
                alt="current"
                className="w-full h-full object-cover"
              />
            ) : null}
          </div>
        </div>
      </div>

      {/* Error message spans full width */}
      {err && <div className="md:col-span-3 text-rose-600 text-sm">{err}</div>}
    </form>
  );
}
