export default function Field({ label, required, children, hint }) {
  return (
    <div>
      <label className="block mb-1 text-sm font-medium text-gray-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
