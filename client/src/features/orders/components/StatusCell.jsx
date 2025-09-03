import { useEffect, useRef, useState } from "react";
import StatusBadge from "./StatusBadge";
import { normalizeStatus } from "../../../utils/orderStatus";
import { updateOrderStatus } from "../../orders/api/orders.api";
import { notify } from "../../../utils/alerts";

const ALLOWED_FROM_SUBMITTED = ["fulfilled", "cancelled"];

export default function StatusCell({ order, onChanged, askReason = false }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const [pos, setPos] = useState({ top: 0, left: 0 });
  // eslint-disable-next-line no-unused-vars
  const [placement, setPlacement] = useState("bottom"); // bottom | top

  const s = normalizeStatus(order?.status);
  const canEdit = s === "submitted";
  const options = canEdit ? ALLOWED_FROM_SUBMITTED : [];

  // حساب مكان القائمة: يقلب لأعلى إذا ما في مساحة كافية لأسفل
  function placeMenu() {
    if (!btnRef.current || !menuRef.current) return;
    const br = btnRef.current.getBoundingClientRect();
    const mr = menuRef.current.getBoundingClientRect(); // أبعاد القائمة
    const pad = 8;

    // افتراضي: أسفل الزر
    let top = br.bottom + pad;
    let left = br.left;

    // لو خرجت من يمين الشاشة، قصّرها لليمين
    left = Math.min(left, window.innerWidth - mr.width - pad);
    // لو خرجت من يسار الشاشة
    left = Math.max(left, pad);

    // لو مافي مساحة لأسفل → ضعها أعلى الزر
    if (top + mr.height > window.innerHeight - pad) {
      top = Math.max(pad, br.top - mr.height - pad);
      setPlacement("top");
    } else {
      setPlacement("bottom");
    }

    setPos({ top, left });
  }

  useEffect(() => {
    if (!open) return;
    // قياس بعد أن تُرسم القائمة
    const raf = requestAnimationFrame(placeMenu);
    const onScrollOrResize = () => placeMenu();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open]);

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
    <div className="relative inline-block text-right ">
      <button
        ref={btnRef}
        type="button"
        onClick={() => canEdit && setOpen((v) => !v)}
        className={canEdit ? "cursor-pointer" : "cursor-default"}
        title={canEdit ? "تغيير الحالة" : "غير قابل للتعديل"}
      >
        <StatusBadge value={s} />
      </button>

      {open && (
        <>
          {/* خلفية لإغلاق القائمة */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => !saving && setOpen(false)}
          />
          {/* القائمة */}
          <div
            ref={menuRef}
            dir="rtl"
            className="z-50 fixed bg-white border border-slate-200 rounded-2xl shadow-xl p-2 w-fit"
            style={{ top: pos.top, left: pos.left }}
          >
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-500">
                لا خيارات متاحة
              </div>
            ) : (
              <div className="space-y-2">
                {options.map((opt) => (
                  <button
                    key={opt}
                    disabled={saving}
                    onClick={() => changeTo(opt)}
                    className="block text-right rounded-lg cursor-pointer disabled:opacity-60"
                  >
                    <div className="pointer-events-none">
                      <StatusBadge value={opt} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
