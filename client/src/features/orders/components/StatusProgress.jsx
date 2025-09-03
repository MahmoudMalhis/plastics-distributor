// client/src/features/orders/components/StatusProgress.jsx
import {
  STATUS_FLOW,
  statusStepIndex,
  normalizeStatus,
} from "../../../utils/orderStatus";

export default function StatusProgress({ value }) {
  const k = normalizeStatus(value);
  const current = statusStepIndex(k);

  return (
    <div className="flex items-center gap-3 select-none">
      {STATUS_FLOW.map((st, i) => {
        const active = i <= current;
        return (
          <div key={st} className="flex items-center gap-3">
            <div
              className={`w-7 h-7 rounded-full grid place-items-center text-xs font-bold
              ${
                active
                  ? "bg-blue-600 text-white"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {i + 1}
            </div>
            <div className="text-sm">
              {st === "draft"
                ? "مسودة"
                : st === "submitted"
                ? "مرسلة"
                : "مكتملة"}
            </div>
            {i < STATUS_FLOW.length - 1 && (
              <div
                className={`w-10 h-0.5 ${
                  i < current ? "bg-blue-600" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
      {k === "cancelled" && (
        <span className="ml-2 px-2 py-1 text-xs rounded bg-red-50 text-red-700">
          ملغاة
        </span>
      )}
    </div>
  );
}
