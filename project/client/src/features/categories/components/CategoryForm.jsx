// src/features/categories/components/CategoryForm.jsx
import FormInput from "../../../components/ui/FormInput";

export default function CategoryForm({ form, setForm, err, onSubmit }) {
  return (
    <form
      id="category-form"
      onSubmit={onSubmit}
      className="space-y-4"
      dir="rtl"
    >
      <FormInput
        label="اسم التصنيف"
        required
        value={form.name}
        onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
        placeholder="مثل: عبوات / مواد خام / أدوات..."
        error={err || undefined}
      />
    </form>
  );
}
