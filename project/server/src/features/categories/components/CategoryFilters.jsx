// src/features/categories/components/CategoryFilters.jsx
import SearchInput from "../../../components/ui/SearchInput";

export default function CategoryFilters({ q, setQ }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6" dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <SearchInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث باسم التصنيف"
        />
        <div />
        <div />
      </div>
    </div>
  );
}
