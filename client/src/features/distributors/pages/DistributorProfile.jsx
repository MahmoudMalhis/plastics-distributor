import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import PageHeader from "../../../components/ui/PageHeader";
import { getDistributor } from "../api/distributors.api";
import { imageUrl } from "../../../utils/format";

export default function DistributorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [distributor, setDistributor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getDistributor(id);
        if (!cancelled) setDistributor(data);
      } catch (e) {
        if (!cancelled)
          setError(e?.response?.data?.error || "تعذر تحميل بيانات الموزع");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-10 text-center">
        جارٍ التحميل...
      </div>
    );
  }
  if (error || !distributor) {
    return (
      <div className="min-h-screen bg-slate-50 p-10 text-center">
        <h2 className="text-lg font-bold mb-2">تعذر عرض بيانات الموزع</h2>
        <p className="text-[#49739c] mb-4">{error || "الموزع غير موجود"}</p>
        <button
          onClick={() => navigate("/admin/distributors")}
          className="inline-flex items-center justify-center bg-blue-600 text-white font-bold py-2.5 px-4 sm:px-5 rounded-lg shadow-md hover:bg-blue-700 transition cursor-pointer"
        >
          العودة لقائمة الموردين
        </button>
      </div>
    );
  }

  const vehicleOwnershipLabel =
    distributor.company_vehicle == null
      ? "—"
      : distributor.company_vehicle
      ? "تابعة للشركة"
      : "شخصية";
  const statusLabel = distributor.active ? "نشط" : "موقوف";

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto py-5 px-4 space-y-6">
        <PageHeader title={`حساب الموزع: ${distributor.name}`}>
          <button
            className="inline-flex items-center justify-center bg-blue-600 text-white font-bold py-2.5 px-4 sm:px-5 rounded-lg shadow-md hover:bg-blue-700 transition cursor-pointer"
            onClick={() => navigate("/admin/distributors")}
          >
            <span className="material-icons">keyboard_backspace</span>
          </button>
        </PageHeader>
        {/* بيانات أساسية */}
        <div className="bg-white border border-[#cedbe8] rounded-xl p-4">
          <h3 className="text-xl font-bold mb-3">البيانات الأساسية</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <Info label="الاسم" value={distributor.name} />
            <Info label="اسم المستخدم" value={distributor.username || "—"} />
            <Info label="الهاتف" value={distributor.phone || "—"} />
            <Info label="هاتف إضافي" value={distributor.phone2 || "—"} />
            <Info label="العنوان" value={distributor.address || "—"} />
            <Info label="الملاحظات" value={distributor.notes || "—"} />
            <Info label="الحالة" value={statusLabel} />
            <Info
              label="الحساب مفعل؟"
              value={distributor.must_change_password ? "لا" : "نعم"}
            />
          </div>
        </div>

        {/* صورة الهوية */}
        <div className="bg-white border border-[#cedbe8] rounded-xl p-4">
          <h3 className="text-xl font-bold mb-3">صورة الهوية</h3>
          {distributor.id_image_url ? (
            <img
              src={imageUrl(distributor.id_image_url)}
              alt="صورة الهوية"
              className="w-64 max-w-full h-auto rounded-lg border border-gray-200"
            />
          ) : (
            <div className="text-[#49739c] text-sm">لا توجد صورة هوية</div>
          )}
        </div>

        {/* معلومات السيارة */}
        <div className="bg-white border border-[#cedbe8] rounded-xl p-4">
          <h3 className="text-xl font-bold mb-3">معلومات السيارة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <Info label="رقم اللوحة" value={distributor.vehicle_plate || "—"} />
            <Info label="نوع السيارة" value={distributor.vehicle_type || "—"} />
            <Info
              label="موديل السيارة"
              value={distributor.vehicle_model || "—"}
            />
            <Info label="ملكية السيارة" value={vehicleOwnershipLabel} />
          </div>
        </div>

        {/* المناطق المسئول عنها */}
        <div className="bg-white border border-[#cedbe8] rounded-xl p-4">
          <h3 className="text-xl font-bold mb-3">المناطق المسئول عنها</h3>
          <div className="text-sm text-[#0d141c] whitespace-pre-wrap">
            {distributor.responsible_areas || "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-[#49739c] mb-1">{label}</div>
      <div className="text-[#0d141c] font-semibold break-words">
        {value != null && value !== "" ? value : "—"}
      </div>
    </div>
  );
}
