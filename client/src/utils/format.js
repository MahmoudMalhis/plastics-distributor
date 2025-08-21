const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export function currency(n) {
  if (n == null || n === "") return "-";
  const num = Number(n);
  return new Intl.NumberFormat("ar-EG", { style: "currency", currency: "ILS" })
    .format(num)
    .replace("‏", "");
}

export function imageUrl(path) {
  if (!path) return "";
  const hasSlash = String(path).startsWith("/");
  return `${API}${hasSlash ? "" : "/"}${path}`;
}
