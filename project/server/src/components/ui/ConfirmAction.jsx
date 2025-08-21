// src/components/ui/ConfirmAction.jsx
import { dialog } from "../../utils/alerts"; // لو عامل alias "@". إن لم تكن تستخدم alias استبدلها بمسار نسبي.
import IconButton from "./IconButton";

export default function ConfirmAction({
  onConfirm,
  title = "هل أنت متأكد؟",
  text = "لا يمكن التراجع عن هذه العملية.",
  confirmText = "تأكيد",
  cancelText = "إلغاء",
  // مظهر الزر:
  as = IconButton, // أو 'button'
  icon = "check",
  variant = "warning",
  size = "md",
  children, // نص الزر إن رغبت
  ...rest
}) {
  const Comp = as;

  async function handleClick(e) {
    e.preventDefault();
    let ok = false;
    try {
      if (typeof dialog === "function") {
        ok = await dialog({
          title,
          text,
          icon: "warning",
          confirmText,
          cancelText,
        });
      } else {
        ok = window.confirm(`${title}\n${text}`);
      }
    } catch {
      ok = window.confirm(`${title}\n${text}`);
    }
    if (ok) {
      await onConfirm?.(e);
    }
  }

  // إن كان as=IconButton (المكوّن الافتراضي)
  if (Comp === IconButton) {
    return (
      <IconButton
        onClick={handleClick}
        icon={icon}
        variant={variant}
        size={size}
        {...rest}
      >
        {children}
      </IconButton>
    );
  }

  // أي عنصر آخر (زر عادي مثلًا)
  return (
    <Comp onClick={handleClick} {...rest}>
      {children}
    </Comp>
  );
}
