// src/features/products/api/products.api.js
import { api } from "../../../lib/api";

/** جلب المنتجات مع فلاتر */
export async function listProducts(params) {
  const r = await api.get("/api/products", { params });
  const d = r.data;
  return Array.isArray(d) ? d : d.items || [];
}

/** إنشاء منتج جديد */
export async function createProduct(dto) {
  const r = await api.post("/api/products", dto);
  return r.data;
}

/** تعديل منتج */
export async function updateProduct(id, dto) {
  const r = await api.patch(`/api/products/${id}`, dto);
  return r.data;
}

/** رفع صورة */
export function uploadProductImage(id, file) {
  const fd = new FormData();
  fd.append("image", file);
  return api.post(`/api/products/${id}/image`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

/** أرشفة/استرجاع */
export function archiveProduct(id) {
  return api.post(`/api/products/${id}/archive`);
}
export function restoreProduct(id) {
  return api.post(`/api/products/${id}/restore`);
}
