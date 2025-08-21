// src/features/categories/api/categories.api.js
import { api } from "../../../lib/api";

// جلب التصنيفات
export async function listCategories() {
  const r = await api.get("/api/categories");
  return Array.isArray(r.data) ? r.data : [];
}

// إنشاء تصنيف
export async function createCategory(dto) {
  const r = await api.post("/api/categories", dto);
  return r.data;
}

// تعديل تصنيف
export async function updateCategory(id, dto) {
  const r = await api.patch(`/api/categories/${id}`, dto);
  return r.data;
}

// حذف تصنيف
export function deleteCategory(id) {
  return api.delete(`/api/categories/${id}`);
}
