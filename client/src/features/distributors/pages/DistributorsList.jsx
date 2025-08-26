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
} from "../api/distributors.api";
import DistributorsForm from "../components/DistributorsForm";

export default function DistributorsList() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({
    id: null,
    name: "",
    phone: "",
    address: "",
    notes: "",
    username: "",
  });

  async function fetchDistributors() {
    try {
      setLoading(true);
      setErr("");
      const rows = await listDistributor({ search });
      setItems(rows);
      console.log(rows);
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
    setErr("");
    setForm({
      id: null,
      name: "",
      phone: "",
      address: "",
      notes: "",
      username: "",
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
      await updateDistributor(distributor.id, { active: nextActive });
      setItems((prev) =>
        prev.map((item) =>
          item.id === distributor.id ? { ...item, active: nextActive } : item
        )
      );
      notify(
        "success",
        nextActive ? "تم تفعيل المورد بنجاح." : "تم إيقاف المورد بنجاح."
      );
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
        const data = await updateDistributor(form.id, {
          name,
          phone: form.phone,
          address: form.address,
          notes: form.notes,
          username: form.username,
        });
        setItems((prev) =>
          prev
            .map((c) => (c.id === form.id ? data : c))
            .sort((a, b) => a.name.localeCompare(b.name, "ar"))
        );
      } else {
        const data = await createDistributor({
          name,
          phone: form.phone,
          address: form.address,
          notes: form.notes,
          username: form.username,
        });
        setItems((prev) =>
          [...prev, data].sort((a, b) => a.name.localeCompare(b.name, "ar"))
        );
      }
      setOpen(false);
      notify("success", "تم الحفظ بنجاح");
    } catch (error) {
      setErr("error", error?.response?.data?.error || "فشل الحفظ");
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
          مورد جديد
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
    </>
  );
}
