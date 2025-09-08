const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export function currency(n) {
  if (n == null || n === "") return "-";
  const num = Number(n);
  return new Intl.NumberFormat("en-IL", {
    style: "currency",
    currency: "ILS",
  }).format(num);
}

export function fmtDateTime(d) {
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? "-" : dt.toLocaleString("en-IL");
}

export function nowForDatetimeLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
}

export function imageUrl(path) {
  if (!path) return "";
  const hasSlash = String(path).startsWith("/");
  return `${API}${hasSlash ? "" : "/"}${path}`;
}
