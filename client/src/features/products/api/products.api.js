// client/src/features/products/api/products.api.js
import { api } from "../../../lib/api";

export function imageUrl(path) {
  const raw = String(path || "");
  if (/^https?:\/\//i.test(raw)) return raw;
  const baseURL = api?.defaults?.baseURL || "";
  let base = baseURL.replace(/\/?api\/?$/i, "");
  if (!base.endsWith("/")) base += "/";
  const clean = raw.replace(/^\/+/, "");
  return base + clean;
}

export async function listProducts(params) {
  const { data } = await api.get("/api/products", { params });
  if (Array.isArray(data)) return data;
  return data?.items || data?.rows || [];
}

export async function searchProducts({
  q,
  categoryId,
  page = 1,
  pageSize = 12,
  sort = "latest",
} = {}) {
  const params = {
    q,
    categoryId,
    category_id: categoryId,
    page,
    pageSize,
    sort,
  };
  Object.keys(params).forEach(
    (k) => params[k] === undefined && delete params[k]
  );

  const { data } = await api.get("/api/products", { params });

  if (Array.isArray(data)) return { rows: data, total: data.length };
  return {
    rows: data?.rows || data?.items || [],
    total: Number(data?.total ?? data?.count ?? 0),
  };
}

export async function createProduct(dto) {
  const { data } = await api.post("/api/products", dto);
  return data;
}

export async function updateProduct(id, dto) {
  const { data } = await api.patch(`/api/products/${id}`, dto);
  return data;
}

export function uploadProductImage(id, file) {
  const fd = new FormData();
  fd.append("image", file);
  return api.post(`/api/products/${id}/image`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export function archiveProduct(id) {
  return api.post(`/api/products/${id}/archive`);
}
export function restoreProduct(id) {
  return api.post(`/api/products/${id}/restore`);
}

export async function listCategories() {
  const { data } = await api.get("/api/categories");
  if (Array.isArray(data)) return { rows: data };
  return data || { rows: [] };
}
