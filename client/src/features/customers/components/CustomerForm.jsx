import FormInput from "../../../components/ui/FormInput";

export default function CustomerForm({ form, setForm, error }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir="rtl">
      <FormInput
        label="اسم العميل"
        required
        value={form.name}
        onChange={(e) => setForm((cust) => ({ ...cust, name: e.target.value }))}
        placeholder="أدخل اسم العميل"
      />
      <FormInput
        label="رقم الهاتف"
        value={form.phone}
        onChange={(e) =>
          setForm((cust) => ({ ...cust, phone: e.target.value }))
        }
        placeholder="مثال: 0599999999"
      />
      <FormInput
        label="العنوان"
        value={form.address}
        onChange={(e) =>
          setForm((cust) => ({ ...cust, address: e.target.value }))
        }
        placeholder="أدخل عنوان العميل"
      />
      <FormInput
        label="ملاحظات"
        value={form.notes}
        onChange={(e) =>
          setForm((cust) => ({ ...cust, notes: e.target.value }))
        }
        placeholder="أدخل ملاحظات إضافية"
      />
      {form.customer_sku && (
        <FormInput
          label="رمز العميل"
          value={form.customer_sku}
          readOnly
          disabled
        />
      )}
      {error && (
        <div className="text-red-600 text-sm mt-2 col-span-2">{error}</div>
      )}
    </div>
  );
}
