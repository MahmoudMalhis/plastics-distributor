// progect/client/src/features/customers/components/DistributorSelect.jsx
import { useEffect, useState, useCallback } from "react";
import AsyncSelect from "react-select/async";
import {
  getDistributor,
  listActiveDistributors,
} from "../api/distributors.api"; // تأكد من هذا المسار

export default function DistributorSelect({
  value,
  onChange,
  disabled = false,
  placeholder = "اختر موزّع…",
  className,
}) {
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (value == null) return setSelected(null);
      try {
        const d = await getDistributor(value);
        if (mounted && d) setSelected({ value: d.id, label: d.name, meta: d });
      } catch {
        if (mounted) setSelected(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [value]);

  const mapOptions = useCallback(
    (rows = []) => rows.map((d) => ({ value: d.id, label: d.name, meta: d })),
    []
  );

  // مهم: loadOptions ترجع Promise
  const loadOptions = useCallback(
    async (inputValue) => {
      const rows = await listActiveDistributors({ q: inputValue || "" });
      // طبّع النتيجة إلى Array لو الـ API يرجّع {items:[]}
      const list = Array.isArray(rows) ? rows : rows?.items || rows?.rows || [];
      return mapOptions(list);
    },
    [mapOptions]
  );

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
        onChange={(opt) => {
          setSelected(opt || null);
          onChange?.(opt ? opt.value : null);
        }}
        filterOption={() => true}
        menuPortalTarget={
          typeof document !== "undefined" ? document.body : null
        }
        styles={{
          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
          control: (base) => ({ ...base, minHeight: 42 }),
        }}
        formatOptionLabel={(opt) => (
          <div className="flex flex-col">
            <span className="font-medium">{opt.meta?.name ?? opt.label}</span>
          </div>
        )}
        noOptionsMessage={() => "لا توجد نتائج"}
        loadingMessage={() => "جاري التحميل…"}
      />
    </div>
  );
}
