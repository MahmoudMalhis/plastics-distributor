// src/components/ui/FormInput.jsx
import { useId } from "react";

export default function FormInput({
  as = "input", // "input" | "textarea" | "select" | "custom"
  type = "text",
  id,
  label,
  hint,
  error,
  required,
  className = "",
  inputClassName = "",
  children, // لمحتوى select أو custom
  ...rest
}) {
  const generatedId = useId();
  const inputId = id || `fi-${generatedId}`;

  const isTextarea = as === "textarea";
  const isSelect = as === "select";
  const isCustom = as === "custom";

  const base =
    "w-full rounded-lg border focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-500 bg-white";
  const size = isTextarea
    ? "min-h-[44px] py-2 px-3"
    : isSelect
    ? "h-11 px-3"
    : "h-11 px-3";
  const errorCls = error ? " border-rose-400 focus:ring-rose-500" : "";
  const disabledCls = rest.disabled ? " bg-gray-100 cursor-not-allowed" : "";

  return (
    <div dir="rtl" className={className}>
      {label && (
        <label
          htmlFor={inputId}
          className="block mb-1 text-sm font-medium text-gray-700"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* وضع مخصص: نعرض children كما هو (مفيد لحقل بحث بأيقونة داخلية) */}
      {isCustom ? (
        <div aria-invalid={!!error}>{children}</div>
      ) : as === "textarea" ? (
        <textarea
          id={inputId}
          className={`${base} ${size} ${inputClassName}${errorCls}${disabledCls}`}
          aria-invalid={!!error}
          {...rest}
        >
          {children}
        </textarea>
      ) : as === "select" ? (
        <select
          id={inputId}
          className={`${base} ${size} ${inputClassName}${errorCls}${disabledCls}`}
          aria-invalid={!!error}
          {...rest}
        >
          {children}
        </select>
      ) : (
        <input
          id={inputId}
          type={type}
          className={`${base} ${size} ${inputClassName}${errorCls}${disabledCls}`}
          aria-invalid={!!error}
          {...rest}
        />
      )}

      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
