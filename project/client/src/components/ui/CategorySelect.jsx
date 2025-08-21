import { promptText, notify } from "../../utils/alerts";
import { api } from "../../lib/api";

export default function CategorySelect({
  value,
  onChange,
  categories,
  setCategories,
  allowCreate = true,
}) {
  async function handleChange(e) {
    const val = e.target.value;
    if (allowCreate && val === "__new__") {
      const { value: name, isConfirmed } = await promptText({
        title: "إضافة تصنيف جديد",
        label: "اسم التصنيف",
        placeholder: "مثل: عبوات / مواد خام / ...",
      });
      if (isConfirmed && name) {
        try {
          const { data } = await api.post("/api/categories", { name });
          setCategories((prev) =>
            [...(prev || []), data]
              .filter(Boolean)
              .sort((a, b) =>
                (a?.name ?? "").localeCompare(b?.name ?? "", "ar")
              )
          );
          onChange(String(data?.id ?? data?.insertId ?? ""));
          notify("success", "تمت إضافة التصنيف");
        } catch (err) {
          notify("error", "فشل إضافة التصنيف");
        }
      }
      return;
    }
    onChange(val);
  }

  return (
    <select
      className="w-full h-11 px-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      value={value}
      onChange={handleChange}
      required
    >
      <option value="">اختر تصنيفًا</option>
      {categories?.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
      {allowCreate && <option value="__new__">+ إضافة تصنيف جديد</option>}
    </select>
  );
}
