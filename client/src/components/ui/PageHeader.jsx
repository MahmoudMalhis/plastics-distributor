export default function PageHeader({ title, children }) {
  return (
    <div className="flex gap-3 items-center justify-between mb-6">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">{title}</h2>
      <div className="flex justify-between items-center mr-auto gap-2">
        {children}
      </div>
    </div>
  );
}
