/* eslint-disable react-hooks/exhaustive-deps */
// progect/client/src/features/customers/components/DistributorSelect.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncSelect from "react-select/async";
import {
  getDistributor,
  listActiveDistributors,
} from "../api/distributors.api";

// دالة مساعدة بدون تبعيات خارجية
function debounce(fn, wait = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/**
 * props:
 * - value: number | null              // id للموزّع الحالي
 * - onChange: (id|null) => void
 * - disabled?: boolean
 * - placeholder?: string
 * - className?: string
 */
export default function DistributorSelect({
  value,
  onChange,
  disabled = false,
  placeholder = "اختر موزّع…",
  className,
}) {
  const [selected, setSelected] = useState(null);

  // حمّل خيار البداية إن كان عندنا id بدون بيانات معروضة
  useEffect(() => {
    let mounted = true;
    async function loadInitial() {
      if (value == null) {
        setSelected(null);
        return;
      }
      // إن كان selected مطابق، لا تعيد التحميل
      if (selected?.value === value) return;

      try {
        const d = await getDistributor(value);
        if (mounted && d) {
          setSelected({ value: d.id, label: d.name, meta: d });
        }
      } catch {
        if (mounted) setSelected(null);
      }
    }
    loadInitial();
    return () => {
      mounted = false;
    };
  }, [value]); // عمداً لا نضع selected هنا

  const mapOptions = useCallback((rows = []) => {
    return rows.map((d) => ({
      value: d.id,
      label: d.name,
      meta: d,
    }));
  }, []);

  // الدالة التي تجلب الخيارات (مع فلترة في الـ backend)
  const fetchOptions = useCallback(
    async (inputValue) => {
      const rows = await listActiveDistributors({ q: inputValue || "" });
      // backend عندك يعيد Array مباشرة
      return mapOptions(rows);
    },
    [mapOptions]
  );

  // لفّها بـ debounce لتخفيف الطلبات
  const loadOptions = useMemo(
    () => debounce(fetchOptions, 300),
    [fetchOptions]
  );

  const handleChange = (opt) => {
    setSelected(opt || null);
    onChange?.(opt ? opt.value : null);
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-1">الموزّع</label>
      <AsyncSelect
        instanceId="distributor-select"
        cacheOptions
        defaultOptions
        loadOptions={loadOptions}
        isDisabled={disabled}
        isClearable
        placeholder={placeholder}
        value={selected}
        onChange={handleChange}
        // لا نفلتر محليًا لأن السيرفر مسؤول عن البحث
        filterOption={() => true}
        // تحسينات للـ menu فوق أي عناصر
        menuPortalTarget={
          typeof document !== "undefined" ? document.body : null
        }
        styles={{
          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
          control: (base) => ({ ...base, minHeight: 42 }),
        }}
        // شكل العنصر في القائمة (اختياري)
        formatOptionLabel={(opt) => (
          <div className="flex flex-col">
            <span className="font-medium">{opt.meta?.name ?? opt.label}</span>
            {opt.meta?.phone ? (
              <span className="text-xs opacity-70">{opt.meta.phone}</span>
            ) : null}
          </div>
        )}
        noOptionsMessage={() => "لا توجد نتائج"}
        loadingMessage={() => "جاري التحميل…"}
      />
    </div>
  );
}
