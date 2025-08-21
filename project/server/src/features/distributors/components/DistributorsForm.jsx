import FormInput from "../../../components/ui/FormInput";

export default function DistributorsForm({ form, setForm, error }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 " dir="rtl">
      <FormInput
        label="الاسم"
        required
        value={form.name}
        onChange={(e) => setForm((dist) => ({ ...dist, name: e.target.value }))}
        placeholder="أدخل اسم المورد"
      />
      <FormInput
        label="الهاتف"
        required
        value={form.phone}
        onChange={(e) =>
          setForm((dist) => ({ ...dist, phone: e.target.value }))
        }
        placeholder="00970599999999"
      />
      <FormInput
        label="العنوان"
        value={form.address}
        onChange={(e) =>
          setForm((dist) => ({ ...dist, address: e.target.value }))
        }
        placeholder="أدخل عنوان المورد"
      />
      <FormInput
        label="ملاحظات"
        value={form.notes}
        onChange={(e) =>
          setForm((dist) => ({ ...dist, notes: e.target.value }))
        }
        placeholder="أدخل ملاحظات إضافية"
      />
      <FormInput
        label="اسم المستخدم"
        value={form.username}
        onChange={(e) =>
          setForm((dist) => ({ ...dist, username: e.target.value }))
        }
        placeholder="أدخل اسم المستخدم"
      />
      {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
    </div>
  );
}
