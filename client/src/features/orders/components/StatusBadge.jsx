// client/src/features/orders/components/StatusBadge.jsx
import {
  statusLabel,
  statusClasses,
  statusDotClass,
  normalizeStatus,
} from "../../../utils/orderStatus";

export default function StatusBadge({ value, className = "" }) {
  const s = normalizeStatus(value);
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${statusClasses(
        s
      )} ${className}`}
    >
      <span className={`w-2.5 h-2.5 rounded-full ${statusDotClass(s)}`} />
      {statusLabel(s)}
    </span>
  );
}
