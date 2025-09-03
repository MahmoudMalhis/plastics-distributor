import { useState } from "react";
import StatusBadge from "./StatusBadge";
import { normalizeStatus } from "../utils/orderStatus";
import { updateOrderStatus } from "../../orders/api/orders.api";
import { notify } from "../../../utils/alerts";

// الحالات المسموح التبديل لها من "submitted"
const ALLOWED_FROM_SUBMITTED = ["fulfilled", "cancelled"];

export default function StatusCell({
  order, // { id, status, ... }
  onChanged, // callback(newStatus, updatedOrder?) لإبلاغ الجدول
  askReason = false, // لو بدك تطلب سبب قبل الإرسال
  role = "distributor", // للاستخدام مستقبلاً بالصلاحيات
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const s = normalizeStatus(order?.status);

  const canEdit = s === "submitted"; // حسب طلبك: يسمح التعديل فقط إن كانت "مرسلة"

  const options = s === "submitted" ? ALLOWED_FROM_SUBMITTED : []; // ما في خيارات لحالات أخرى من الجدول

  async function changeTo(next) {
    if (!next || next === s) return;
    let reason = "";
    if (askReason) {
      const r = prompt("سبب تغيير الحالة (اختياري):");
      if (r != null) reason = r.trim();
    }
    try {
      setSaving(true);
      const updated = await updateOrderStatus(order.id, next, reason);
      notify("success", "تم تحديث الحالة");
      setOpen(false);
      onChanged?.(next, updated);
    } catch (err) {
      notify("error", err?.message || "فشل تحديث الحالة");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative inline-block text-right">
      <button
        type="button"
        onClick={() => canEdit && setOpen((v) => !v)}
        className={canEdit ? "cursor-pointer" : "cursor-default"}
        title={canEdit ? "تغيير الحالة" : "غير قابل للتعديل"}
      >
        <StatusBadge value={s} />
      </button>

      {open && (
        <div
          className="absolute z-20 mt-2 w-40 bg-white border border-slate-200 rounded-xl shadow-lg p-2"
          onMouseLeave={() => !saving && setOpen(false)}
        >
          <div className="text-xs text-slate-500 px-2 mb-2">تغيير إلى:</div>
          {options.map((opt) => (
            <button
              key={opt}
              disabled={saving}
              onClick={() => changeTo(opt)}
              className="w-full text-right px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer disabled:opacity-60"
            >
              {opt === "fulfilled" ? "مكتملة" : "ملغاة"}
            </button>
          ))}
          {options.length === 0 && (
            <div className="px-3 py-2 text-sm text-slate-500">
              لا خيارات متاحة
            </div>
          )}
        </div>
      )}
    </div>
  );
}
