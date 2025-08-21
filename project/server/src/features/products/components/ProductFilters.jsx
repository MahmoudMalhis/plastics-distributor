// src/features/products/components/ProductFilters.jsx
import CategorySelect from "../../../components/ui/CategorySelect";
import SearchInput from "../../../components/ui/SearchInput";

export default function ProductFilters({
  search,
  setSearch,
  catId,
  setCatId,
  includeArchived,
  setIncludeArchived,
  categories,
  setCategories,
}) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6" dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث بالاسم أو SKU"
        />

        <div>
          <CategorySelect
            value={catId}
            onChange={setCatId}
            categories={categories}
            setCategories={setCategories}
            allowCreate
          />
        </div>

        <div className="flex items-center">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              className="size-4"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
            />
            <span className="text-sm text-gray-700">عرض المنتحات المنتهية</span>
          </label>
        </div>
      </div>
    </div>
  );
}
