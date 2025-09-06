/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import PageHeader from "../../../components/ui/PageHeader";
import DataTable from "../../../components/ui/DataTable";
import Modal from "../../../components/ui/Modal";
import DistributorRow from "../components/DistributorsRow";
import DistributorsFilters from "../components/DistributorsFilters";
import { notify } from "../../../utils/alerts";
import {
  listDistributor,
  updateDistributor,
  issuePasswordToken,
  createDistributor,
  uploadDistributorIdImage,
  listActiveDistributors,
} from "../api/distributors.api";
import DistributorsForm from "../components/DistributorsForm";

export default function DistributorsList() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [transferOpen, setTransferOpen] = useState(false);
  const [toDeactivate, setToDeactivate] = useState(null); // distributor object
  const [activeTargets, setActiveTargets] = useState([]);
  const [targetId, setTargetId] = useState("");
  const [form, setForm] = useState({
    id: null,
    name: "",
    phone: "",
    phone2: "",
    address: "",
    notes: "",
    username: "",
    idImageFile: null,
    vehicle_plate: "",
    vehicle_type: "",
    vehicle_model: "",
    company_vehicle: false,
    responsible_areas: "",
  });

  async function fetchDistributors() {
    try {
      setLoading(true);
      setErr("");
      const rows = await listDistributor({ search });
      setItems(rows);
    } catch (error) {
      setErr(error?.response?.data?.error || "فشل جلب الموردين");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDistributors();
  }, [search]);

  function openCreate() {
    setForm({
      id: null,
      name: "",
      phone: "",
      phone2: "",
      address: "",
      notes: "",
      username: "",
      idImageFile: null,
      vehicle_plate: "",
      vehicle_type: "",
      vehicle_model: "",
      company_vehicle: false,
      responsible_areas: "",
    });
    setOpen(true);
  }

  function openEdit(distributor) {
    setForm({
      id: distributor.id,
      name: distributor.name || "",
      phone: distributor.phone || "",
      phone2: distributor.phone2 || "",
      address: distributor.address || "",
      notes: distributor.notes || "",
      username: distributor.username || "",
      idImageFile: null,
      vehicle_plate: distributor.vehicle_plate || "",
      vehicle_type: distributor.vehicle_type || "",
      vehicle_model: distributor.vehicle_model || "",
      company_vehicle:
        distributor.company_vehicle === true ||
        distributor.company_vehicle === 1,
      responsible_areas: distributor.responsible_areas || "",
    });
    setOpen(true);
  }

  const onSendPasswordLink = async (distributor) => {
    try {
      const { waText, setUrl } = await issuePasswordToken(distributor.id);
      console.log(waText);
      const text =
        waText ||
        `مرحبا ${
          distributor.name || ""
        },يمكنك تعيين كلمة المرور  من خلال الرابط التالي: ${setUrl}`;
      const phonDetails = String(distributor.phone || "").replace(/\D/g, "");
      if (phonDetails) {
        const waUrl = `https://wa.me/${phonDetails}?text=${encodeURIComponent(
          text
        )}`;
        window.open(waUrl, "_blank");
      } else {
        await navigator.clipboard.writeText(text);
        notify("success", "تم نسخ رابط تعيين كلمة المرور إلى الحافظة.");
      }
    } catch (error) {
      notify(
        "error",
        error?.response?.data?.error || "فشل في إرسال رابط تعيين كلمة المرور."
      );
    }
  };

  const onToggleActive = async (distributor) => {
    try {
      const isActive = distributor?.active === true;
      const nextActive = !isActive;

      if (nextActive) {
        // تفعيل فقط → نفّذ مباشرة كما هو
        await updateDistributor(distributor.id, { active: true });
        setItems((prev) =>
          prev.map((item) =>
            item.id === distributor.id ? { ...item, active: true } : item
          )
        );
        notify("success", "تم تفعيل المورد بنجاح.");
        return;
      }

      // إيقاف: افتح مودال النقل
      setToDeactivate(distributor);
      setTargetId("");
      setTransferOpen(true);

      // حمّل الموزعين النشطين (باستثناء هذا)
      const rows = await listActiveDistributors();
      const options = (rows || []).filter((d) => d.id !== distributor.id);
      setActiveTargets(options);
    } catch (error) {
      notify(
        "error",
        error?.response?.data?.error || "فشل في تحديث حالة المورد."
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = (form.name || "").trim();
    if (!name) return;

    setLoading(true);
    setErr("");

    try {
      if (form.id) {
        const updated = await updateDistributor(form.id, {
          name,
          phone: form.phone,
          phone2: form.phone2,
          address: form.address,
          notes: form.notes,
          username: form.username,
          vehicle_plate: form.vehicle_plate,
          vehicle_type: form.vehicle_type,
          vehicle_model: form.vehicle_model,
          company_vehicle: form.company_vehicle,
          responsible_areas: form.responsible_areas,
        });

        // إذا تم رفع صورة هوية جديدة
        let finalDistributor = updated;
        if (form.idImageFile) {
          const resp = await uploadDistributorIdImage(
            form.id,
            form.idImageFile
          );
          finalDistributor = { ...updated, id_image_url: resp.id_image_url };
        }

        // تحديث قائمة العناصر
        setItems((prev) =>
          prev
            .map((d) => (d.id === form.id ? finalDistributor : d))
            .sort((a, b) => a.name.localeCompare(b.name, "ar"))
        );
      } else {
        // إنشاء موزع جديد
        const result = await createDistributor({
          name,
          phone: form.phone,
          phone2: form.phone2,
          address: form.address,
          notes: form.notes,
          username: form.username,
          vehicle_plate: form.vehicle_plate,
          vehicle_type: form.vehicle_type,
          vehicle_model: form.vehicle_model,
          company_vehicle: form.company_vehicle,
          responsible_areas: form.responsible_areas,
        });

        let newDist = result.distributor || result;

        // رفع صورة الهوية إن وجدت
        if (form.idImageFile) {
          const resp = await uploadDistributorIdImage(
            newDist.id,
            form.idImageFile
          );
          newDist = { ...newDist, id_image_url: resp.id_image_url };
        }

        // إضافة العنصر الجديد للقائمة
        setItems((prev) =>
          [...prev, newDist].sort((a, b) => a.name.localeCompare(b.name, "ar"))
        );
      }
      setOpen(false);
      notify("success", "تم الحفظ بنجاح");
    } catch (error) {
      setErr(error?.response?.data?.error || "فشل الحفظ");
      notify("error", "فشل الحفظ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="قائمة الموزعين">
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center bg-blue-600 text-white font-bold py-2.5 px-4 sm:px-5 rounded-lg shadow-md hover:bg-blue-700 transition cursor-pointer"
        >
          <span className="material-icons ml-2 sm:ml-3 text-base sm:text-[20px]">
            add
          </span>
          موزع جديد
        </button>
      </PageHeader>

      <DistributorsFilters search={search} setSearch={setSearch} />

      <DataTable
        head={[
          { label: "#", className: "text-right w-16" },
          { label: "الاسم", className: "text-right" },
          { label: "الهاتف", className: "text-right" },
          { label: "العنوان", className: "text-right" },
          { label: "الملاحظات", className: "text-right" },
          { label: "المستخدم", className: "text-right" },
          { label: "الإجراءات", className: "text-center" },
        ]}
      >
        {loading ? (
          <tr>
            <td className="p-4" colSpan={7}>
              جاري التحميل...
            </td>
          </tr>
        ) : err ? (
          <tr>
            <td className="p-4 text-red-600" colSpan={7}>
              {err}
            </td>
          </tr>
        ) : items.length === 0 ? (
          <tr>
            <td className="p-4" colSpan={7}>
              لا توجد نتائج
            </td>
          </tr>
        ) : (
          items.map((distributor, index) => (
            <DistributorRow
              key={distributor.id}
              index={index}
              distributor={distributor}
              onEdit={() => openEdit(distributor)}
              onSendPasswordLink={() => onSendPasswordLink(distributor)}
              onToggleActive={() => onToggleActive(distributor)}
            />
          ))
        )}
      </DataTable>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? "تعديل مورد" : "إضافة مورد جديد"}
        footer={
          <button
            type="submit"
            form="distributor-form"
            disabled={loading}
            className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition cursor-pointer"
          >
            حفظ
          </button>
        }
      >
        <form
          id="distributor-form"
          onSubmit={handleSubmit}
          className="space-y-4"
          dir="rtl"
        >
          <DistributorsForm form={form} setForm={setForm} error={err} />
        </form>
      </Modal>

      <Modal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        title="إيقاف موزّع ونقل العملاء"
        footer={
          <div className="flex gap-2">
            <button
              onClick={() => setTransferOpen(false)}
              className="px-4 h-11 rounded-lg border border-gray-300 hover:bg-gray-50 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              disabled={!targetId}
              onClick={async () => {
                try {
                  if (!toDeactivate) return;
                  await updateDistributor(toDeactivate.id, {
                    active: false,
                    transfer_customers_to: Number(targetId),
                  });
                  // حدّث القائمة محليًا
                  setItems((prev) =>
                    prev.map((item) =>
                      item.id === toDeactivate.id
                        ? { ...item, active: false }
                        : item
                    )
                  );
                  notify("success", "تم نقل العملاء وإيقاف الموزّع بنجاح.");
                  setTransferOpen(false);
                  setToDeactivate(null);
                } catch (error) {
                  notify(
                    "error",
                    error?.response?.data?.error ||
                      "فشل في نقل العملاء/إيقاف الموزّع."
                  );
                }
              }}
              className="inline-flex items-center gap-2 px-4 h-11 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-60 cursor-pointer"
            >
              تأكيد الإيقاف والنقل
            </button>
          </div>
        }
      >
        <div dir="rtl" className="space-y-3">
          <div className="text-sm text-[#49739c]">
            اختر موزّعًا نشطًا لنقل العملاء الخاصين بـ{" "}
            <span className="font-semibold text-[#0d141c]">
              {toDeactivate?.name || ""}
            </span>{" "}
            إليه.
          </div>

          <label className="flex items-stretch rounded-lg">
            <div className="text-[#49739c] flex border border-[#cedbe8] bg-slate-50 items-center justify-center pr-[15px] rounded-r-lg border-l-0 px-2">
              الموزع الهدف
            </div>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="flex w-full min-w-0 flex-1 rounded-lg text-[#0d141c] border border-[#cedbe8] bg-slate-50 h-12 p-[12px] rounded-r-none border-r-0 pr-2 text-base focus:outline-none"
            >
              <option value="">اختر موزعًا نشطًا</option>
              {activeTargets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Modal>
    </>
  );
}
