// client/src/utils/alerts.js
import Swal from "sweetalert2";

// تنسيقات افتراضية
const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 1500,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

// إشعارات سريعة (توست)
export function notify(type, message) {
  Toast.fire({
    icon: type, // success | error | warning | info | question
    title: message,
  });
}

// نوافذ حوارية (بأزرار)
export async function dialog({
  title,
  text,
  icon = "question",
  confirmText = "تأكيد",
  cancelText = "إلغاء",
} = {}) {
  const res = await Swal.fire({
    title,
    text,
    icon, // 'success' | 'error' | 'warning' | 'info' | 'question'
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    focusCancel: true,
    allowOutsideClick: true,
    allowEscapeKey: true,
  });
  // أهم سطر: ارجاع boolean صريح
  return res.isConfirmed === true;
}

export function promptText({ title, label, placeholder = "" }) {
  return Swal.fire({
    title,
    input: "text",
    inputLabel: label,
    inputPlaceholder: placeholder,
    inputAttributes: { dir: "rtl" },
    showCancelButton: true,
    confirmButtonText: "حفظ",
    cancelButtonText: "إلغاء",
    reverseButtons: true,
    preConfirm: (v) => {
      if (!v || !v.trim()) {
        Swal.showValidationMessage("الحقل مطلوب");
      }
      return v?.trim();
    },
  });
}
