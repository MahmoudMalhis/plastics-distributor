// src/components/ui/IconButton.jsx
const variants = {
  neutral: "bg-gray-100 text-gray-700 hover:bg-gray-200",
  primary: "bg-blue-100 text-blue-600 hover:bg-blue-200",
  success: "bg-emerald-100 text-emerald-600 hover:bg-emerald-200",
  danger: "bg-red-100 text-red-600 hover:bg-red-200",
  warning: "bg-amber-100 text-amber-700 hover:bg-amber-200",
};

const sizes = {
  sm: "w-8 h-8 text-[18px]",
  md: "w-9 h-9 text-[20px]",
  lg: "w-10 h-10 text-[22px]",
};

export default function IconButton({
  icon = "bolt",
  variant = "neutral",
  size = "md",
  rounded = true,
  title,
  className = "",
  children,
  ...rest
}) {
  return (
    <button
      type="button"
      title={title}
      className={`inline-flex items-center justify-center transition shadow-sm cursor-pointer
        ${rounded ? "rounded-full" : "rounded-lg px-3"}
        ${variants[variant]}
        ${sizes[size]}
        ${className}`}
      {...rest}
    >
      <span className="material-icons">{icon}</span>
      {children && <span className="ml-2">{children}</span>}
    </button>
  );
}
