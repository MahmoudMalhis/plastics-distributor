// client/src/components/forms/QuantityInput.jsx
import { useId } from "react";

export default function QuantityInput({
  value,
  onChange,
  min = 1,
  max = 9999,
  step = 1,
  disabled = false,
}) {
  const id = useId();

  const toNum = (v, fallback) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const clamp = (n) => Math.min(max, Math.max(min, n));

  const handleChange = (e) => {
    const v = e.target.value;
    if (v === "") return onChange("");
    const n = Number(v);
    if (!Number.isFinite(n)) return;
    onChange(clamp(n));
  };

  const handleBlur = () => {
    if (value === "") return onChange(min);
    onChange(clamp(toNum(value, min)));
  };

  return (
    <input
      id={id}
      dir="rtl"
      inputMode="numeric"
      pattern="[0-9]*"
      type="number"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={disabled}
      className="bg-transparent border px-3 rounded-lg border-[#cedbe8] text-[#0d141c]"
      onWheel={(e) => e.currentTarget.blur()}
    />
  );
}
