export default function PageHeader({ title, children }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">{title}</h2>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}
