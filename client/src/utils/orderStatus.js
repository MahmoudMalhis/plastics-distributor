// client/src/features/orders/utils/orderStatus.js
export const STATUS_FLOW = ["draft", "submitted", "fulfilled"]; // المسار الطبيعي
export const TERMINALS = new Set(["fulfilled", "cancelled"]);

export const STATUS_META = {
  draft: {
    label: "مسودة",
    color: "bg-slate-100 text-slate-700",
    dot: "bg-slate-400",
  },
  submitted: {
    label: "مرسلة",
    color: "bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
  },
  fulfilled: {
    label: "مكتملة",
    color: "bg-green-50 text-green-700",
    dot: "bg-green-500",
  },
  cancelled: {
    label: "ملغاة",
    color: "bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
};

export function normalizeStatus(s) {
  return String(s || "")
    .toLowerCase()
    .trim();
}

export function statusLabel(s) {
  const k = normalizeStatus(s);
  return STATUS_META[k]?.label || s || "—";
}

export function statusClasses(s) {
  const k = normalizeStatus(s);
  return STATUS_META[k]?.color || "bg-slate-100 text-slate-700";
}

export function statusDotClass(s) {
  const k = normalizeStatus(s);
  return STATUS_META[k]?.dot || "bg-slate-400";
}

// كم خطوة تقدّم؟ يفيد شريط التقدّم
export function statusStepIndex(s) {
  const k = normalizeStatus(s);
  const i = STATUS_FLOW.indexOf(k);
  return i >= 0 ? i : k === "cancelled" ? 1 : 0; // الملغي بعد الإرسال عادةً
}
