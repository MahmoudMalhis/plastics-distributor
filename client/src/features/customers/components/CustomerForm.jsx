import FormInput from "../../../components/ui/FormInput";
import DistributorSelect from "../../distributors/components/DistributorSelect";

export default function CustomerForm({
  form,
  setForm,
  error,
  isAdmin,
  submitting,
  setField,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir="rtl">
      {isAdmin && (
        <DistributorSelect
          value={form.distributor_id}
          onChange={(id) => setField("distributor_id", id)}
          disabled={submitting}
        />
      )}
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
      {form.latitude && form.longitude && (
        <a
          href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline text-sm"
        >
          عرض على الخريطة
        </a>
      )}
      {error && (
        <div className="text-red-600 text-sm mt-2 col-span-2">{error}</div>
      )}
    </div>
  );
}
