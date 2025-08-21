export default function FiltersBar({ children }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {children}
      </div>
    </div>
  );
}
