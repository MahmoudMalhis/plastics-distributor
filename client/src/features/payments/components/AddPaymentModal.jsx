// client/src/features/payments/components/AddPaymentModal.jsx
import { useState } from "react";
import Modal from "../../../components/ui/Modal";
import { createPaymentForCustomer } from "../api/payments.api";
import { notify } from "../../../utils/alerts";

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
  const [date, setDate] = useState(""); // optional
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

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
      onClose?.();
      onSuccess?.(); // أعد تحميل العنوان/التايملاين
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
      footer={
        <button
          type="submit"
          form="add-payment-form"
          disabled={loading}
          className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition cursor-pointer"
        >
          {loading ? "جارٍ الحفظ..." : "حفظ"}
        </button>
      }
    >
      <form
        id="add-payment-form"
        onSubmit={submit}
        className="space-y-3"
        dir="rtl"
      >
        <div>
          <label className="block text-sm text-[#49739c] mb-1">المبلغ</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full h-11 rounded-lg border border-[#cedbe8] bg-slate-50 px-3 focus:outline-none"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm text-[#49739c] mb-1">الطريقة</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full h-11 rounded-lg border border-[#cedbe8] bg-slate-50 px-3 focus:outline-none"
          >
            <option value="cash">نقدًا</option>
            <option value="transfer">تحويل</option>
            <option value="check">شيك</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-[#49739c] mb-1">
            مرجع/ملاحظة مختصرة (اختياري)
          </label>
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="w-full h-11 rounded-lg border border-[#cedbe8] bg-slate-50 px-3 focus:outline-none"
            placeholder="رقم الشيك/التحويل..."
          />
        </div>

        <div>
          <label className="block text-sm text-[#49739c] mb-1">
            ملاحظة (اختياري)
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-lg border border-[#cedbe8] bg-slate-50 px-3 py-2 focus:outline-none"
            placeholder="تفاصيل إضافية..."
          />
        </div>

        <div>
          <label className="block text-sm text-[#49739c] mb-1">
            تاريخ الاستلام
          </label>
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full h-11 rounded-lg border border-[#cedbe8] bg-slate-50 px-3 focus:outline-none"
          />
        </div>

        {err ? <div className="text-red-600 text-sm">{err}</div> : null}
      </form>
    </Modal>
  );
}
