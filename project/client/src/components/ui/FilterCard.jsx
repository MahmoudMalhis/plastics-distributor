// src/components/ui/FilterCard.jsx

export default function FilterCard({
  title,
  actions,
  cols = { base: 1, md: 3 },
  className = "",
  children,
}) {
  return (
    <div
      className={`bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6
        ${className}`}
      dir="rtl"
    >
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
          {title && (
            <h3 className="text-base sm:text-lg font-semibold text-gray-800">
              {title}
            </h3>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div
        className={`grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-${
          cols.md || 3
        }`}
      >
        {children}
      </div>
    </div>
  );
}
