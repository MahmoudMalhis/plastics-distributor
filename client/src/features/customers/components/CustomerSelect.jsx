// client/src/features/customers/components/CustomerSelect.jsx
import AsyncSelect from "react-select/async";
import { listCustomers } from "../api/customers.api";

export default function CustomerSelect({ selected, onSelect, onCreateNew }) {
  // دالة لتحويل بيانات العميل إلى شكل يفهمه react‑select
  const toOption = (cust) => ({
    value: cust.id,
    label: cust.name,
    data: cust,
  });

  const loadOptions = async (inputValue) => {
    const { rows } = await listCustomers({ search: inputValue });
    const user = JSON.parse(localStorage.getItem("user"));
    const myDistId = user?.distributor_id ?? null;

    return (
      (rows || [])
        // هنا نحتفظ فقط بعملاء الموزع الحالى (أو كل العملاء إذا كان Admin)
        .filter((c) =>
          myDistId ? Number(c.distributor_id) === Number(myDistId) : true
        )
        .filter((c) => c.active === true || c.active === 1)
        .map(toOption)
    );
  };

  return (
    <div dir="rtl">
      <AsyncSelect
        cacheOptions
        defaultOptions
        loadOptions={loadOptions}
        value={selected ? toOption(selected) : null}
        onChange={(option) => {
          if (option?.data) onSelect(option.data);
        }}
        placeholder="اختر عميلاً..."
        isClearable
        noOptionsMessage={() => "لا توجد نتائج"}
        styles={{
          // تنسيق بسيط ليتوافق مع RTL وتنسيق Tailwind لديك
          control: (base) => ({
            ...base,
            direction: "rtl",
            borderColor: "#cedbe8",
            minHeight: "44px",
          }),
          menu: (base) => ({
            ...base,
            direction: "rtl",
          }),
        }}
        components={{
          // إضافة زر أسفل القائمة لإنشاء عميل جديد
          MenuList: (props) => (
            <>
              {props.children}
              {onCreateNew && (
                <div
                  style={{
                    borderTop: "1px solid #eef3f7",
                    padding: "8px",
                    textAlign: "right",
                    backgroundColor: "#f8fafc",
                    color: "#0d6efd",
                    cursor: "pointer",
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onCreateNew();
                  }}
                >
                  + إضافة عميل جديد
                </div>
              )}
            </>
          ),
        }}
      />
    </div>
  );
}
