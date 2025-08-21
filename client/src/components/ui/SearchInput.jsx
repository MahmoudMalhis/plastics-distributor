import FormInput from "./FormInput";

export default function SearchInput({
  value,
  onChange,
  placeholder = "ابحث...",
  icon = "search",
  className = "",
}) {
  return (
    <FormInput as="custom" label={null}>
      <div className={`relative w-full ${className}`}>
        <input
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full h-11 pl-4 pr-10 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </span>
      </div>
    </FormInput>
  );
}
