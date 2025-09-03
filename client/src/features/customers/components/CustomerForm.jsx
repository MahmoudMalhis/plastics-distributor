import { useState } from "react";
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
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState("");

  const getMyLocation = () => {
    setLocError("");
    if (!("geolocation" in navigator)) {
      setLocError("جهازك لا يدعم تحديد الموقع.");
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        // احفظ بقيم رقمية، مع تقريب مناسب (6–7 منازل عشرية)
        setField("latitude", Number(latitude.toFixed(7)));
        setField("longitude", Number(longitude.toFixed(7)));
        setField("gps_accuracy", Math.round(accuracy)); // اختياري، لو أضفت عمود لاحقًا
        setLocLoading(false);
      },
      (err) => {
        setLocError(
          err.code === err.PERMISSION_DENIED
            ? "تم رفض إذن الموقع. فعّله من إعدادات المتصفح ثم حاول ثانية."
            : "تعذر الحصول على الموقع. تأكد من GPS والإنترنت."
        );
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

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
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-3">
        <FormInput
          label="الموقع"
          type="number"
          value={form.latitude ?? ""}
          onChange={(e) =>
            setField(
              "latitude",
              e.target.value === "" ? "" : Number(e.target.value)
            )
          }
        />
        <div className="mt-5">
          <FormInput
            type="number"
            step="0.0000001"
            value={form.longitude ?? ""}
            onChange={(e) =>
              setField(
                "longitude",
                e.target.value === "" ? "" : Number(e.target.value)
              )
            }
          />
        </div>
        <div className="flex items-end gap-2 mt-5">
          <button
            type="button"
            onClick={getMyLocation}
            disabled={locLoading || submitting}
            className="h-11 px-4 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-60 cursor-pointer"
          >
            {locLoading ? "جارٍ تحديد الموقع..." : "تحديد الموقع"}
          </button>
        </div>
      </div>

      {locError && <div className="text-sm text-red-600">{locError}</div>}

      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  );
}
