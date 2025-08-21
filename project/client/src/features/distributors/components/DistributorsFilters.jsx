import SearchInput from "../../../components/ui/SearchInput";

export default function DistributorsFilters({ search, setSearch }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6" dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <SearchInput
          placeholder="ابحث بالاسم أو الهاتف"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
    </div>
  );
}
