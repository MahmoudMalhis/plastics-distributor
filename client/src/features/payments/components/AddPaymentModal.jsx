import { useEffect, useState } from "react";
import Modal from "../../../components/ui/Modal";
import { createPaymentForCustomer } from "../api/payments.api";
import { notify } from "../../../utils/alerts";
import { nowForDatetimeLocal } from "../../../utils/format";

export default function AddPaymentModal({
  open,
  onClose,
  customerId,
  onSuccess,
}) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash"); // cash, transfer, check
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(""); // datetime-local string
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Initialize default date every time the modal opens
  useEffect(() => {
    if (open) setDate(nowForDatetimeLocal());
  }, [open]);

  async function submit(e) {
    e?.preventDefault?.();
    setErr("");
    const num = Number(amount);
    if (!(num > 0)) {
      setErr("المبلغ يجب أن يكون أكبر من صفر.");
      return;
    }
    try {
      setLoading(true);
      await createPaymentForCustomer(customerId, {
        amount: num,
        method,
        reference: reference || undefined,
        note: note || undefined,
        received_at: date || undefined,
      });
      notify("success", "تم تسجيل الدفعة بنجاح.");
      onSuccess?.();
      // Reset form after success
      setAmount("");
      setMethod("cash");
      setReference("");
      setNote("");
      setDate(nowForDatetimeLocal());
    } catch (e2) {
      setErr(e2?.response?.data?.error || e2?.message || "فشل تسجيل الدفعة.");
      notify("error", "فشل تسجيل الدفعة.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="إضافة دفعة"
      // تم استبدال زر الحفظ بزر "إضافة دفعة" بنفس تنسيقك ويقوم بعملية submit للفورم
      footer={
        <button
          type="submit"
          form="add-payment-form"
          disabled={loading}
          className="mt-6 bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
        >
          <span className="material-icons">add</span>
          {loading ? "جارٍ الحفظ..." : "إضافة دفعة"}
        </button>
      }
    >
      <form
        id="add-payment-form"
        onSubmit={submit}
        className="space-y-3"
        dir="rtl"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col text-gray-600">
            <span className="text-sm mb-1">المبلغ</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full h-11 rounded-lg border border-[#cedbe8] bg-slate-50 px-3 focus:outline-none"
              placeholder="0.00"
            />
          </label>

          <label className="flex flex-col text-gray-600">
            <span className="text-sm mb-1">الطريقة</span>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full h-11 rounded-lg border border-[#cedbe8] bg-slate-50 px-3 focus:outline-none"
            >
              <option value="cash">نقدًا</option>
              <option value="transfer">تحويل</option>
              <option value="check">شيك</option>
            </select>
          </label>

          <label className="flex flex-col text-gray-600">
            <span className="text-sm mb-1">المرجع (اختياري)</span>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full h-11 rounded-lg border border-[#cedbe8] bg-slate-50 px-3 focus:outline-none"
              placeholder="رقم الشيك/التحويل..."
            />
          </label>

          <label className="flex flex-col text-gray-600">
            <span className="text-sm mb-1">تاريخ الاستلام (اختياري)</span>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-11 rounded-lg border border-[#cedbe8] bg-slate-50 px-3 focus:outline-none"
            />
          </label>

          <label className="flex flex-col text-gray-600 sm:col-span-2">
            <span className="text-sm mb-1">ملاحظة (اختياري)</span>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-lg border border-[#cedbe8] bg-slate-50 px-3 py-2 focus:outline-none"
              placeholder="تفاصيل إضافية..."
            />
          </label>
        </div>

        {err ? <div className="text-red-600 text-sm">{err}</div> : null}
      </form>
    </Modal>
  );
}
