import FormInput from "../../../components/ui/FormInput";
import ImageUpload from "../../../components/ui/ImageUpload";

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
        placeholder="970599999999"
      />
      <FormInput
        label="هاتف إضافي"
        required
        value={form.phone2}
        onChange={(e) =>
          setForm((dist) => ({ ...dist, phone2: e.target.value }))
        }
        placeholder="رقم هاتف آخر"
      />
      <FormInput
        label="اسم المستخدم"
        required
        value={form.username}
        onChange={(e) =>
          setForm((dist) => ({ ...dist, username: e.target.value }))
        }
        placeholder="أدخل اسم المستخدم"
      />
      <div>
        <FormInput
          label="العنوان"
          required
          value={form.address}
          onChange={(e) =>
            setForm((dist) => ({ ...dist, address: e.target.value }))
          }
          placeholder="أدخل عنوان المورد"
        />
        <div className="mt-3">
          <FormInput
            as="textarea"
            label="المناطق المسؤول عنها"
            required
            value={form.responsible_areas}
            onChange={(e) =>
              setForm((dist) => ({
                ...dist,
                responsible_areas: e.target.value,
              }))
            }
            placeholder="أدخل أسماء المناطق أو الأحياء"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm text-[#49739c]">صورة الهوية</label>
        <ImageUpload
          required
          file={form.idImageFile}
          onFileChange={(file) =>
            setForm((dist) => ({ ...dist, idImageFile: file }))
          }
        />
      </div>
      <FormInput
        label="رقم لوحة السيارة"
        value={form.vehicle_plate}
        onChange={(e) =>
          setForm((dist) => ({ ...dist, vehicle_plate: e.target.value }))
        }
        placeholder="مثال: 3-123-45"
      />
      <FormInput
        label="نوع السيارة"
        value={form.vehicle_type}
        onChange={(e) =>
          setForm((dist) => ({ ...dist, vehicle_type: e.target.value }))
        }
        placeholder="نوع المركبة"
      />
      <FormInput
        label="موديل السيارة"
        value={form.vehicle_model}
        onChange={(e) =>
          setForm((dist) => ({ ...dist, vehicle_model: e.target.value }))
        }
        placeholder="موديل/سنة الصنع"
      />
      <div className="flex flex-col gap-1">
        <label className="text-sm text-[#49739c]">ملكية المركبة</label>
        <select
          value={form.company_vehicle ? "company" : "personal"}
          onChange={(e) =>
            setForm((dist) => ({
              ...dist,
              company_vehicle: e.target.value === "company",
            }))
          }
          className="w-full h-11 px-3 border border-[#cedbe8] rounded-lg bg-white focus:outline-none"
        >
          <option value="personal">شخصية</option>
          <option value="company">تابعة للشركة</option>
        </select>
      </div>

      <FormInput
        as="textarea"
        label="ملاحظات"
        value={form.notes}
        onChange={(e) =>
          setForm((dist) => ({ ...dist, notes: e.target.value }))
        }
        placeholder="أدخل ملاحظات إضافية"
      />
      {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
    </div>
  );
}
