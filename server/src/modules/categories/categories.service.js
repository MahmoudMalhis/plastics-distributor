// src/modules/categories/categories.service.js
import * as repo from "./categories.repo.js";

export function list() {
  return repo.list();
}

export async function create({ name }) {
  if (!name?.trim()) throw new Error("اسم التصنيف مطلوب");
  return repo.create({ name: name.trim() });
}

export async function update(id, { name }) {
  if (!id) throw new Error("id مطلوب");
  if (!name?.trim()) throw new Error("اسم التصنيف مطلوب");
  return repo.update(id, { name: name.trim() });
}

export function remove(id) {
  if (!id) throw new Error("id مطلوب");
  return repo.remove(id);
}
