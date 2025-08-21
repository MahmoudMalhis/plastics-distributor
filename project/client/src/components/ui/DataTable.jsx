export default function DataTable({ head, children }) {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="w-full overflow-x-auto">
        <table className="min-w-full leading-normal text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-xs sm:text-sm">
              {head.map((h, i) => (
                <th
                  key={i}
                  className={`py-3 px-4 sm:px-6 ${h.className || ""}`}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-gray-700">{children}</tbody>
        </table>
      </div>
    </div>
  );
}
