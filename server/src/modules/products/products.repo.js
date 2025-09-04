// server/src/modules/products/products.repo.js
import db from "../../db/knex.js"; // انتبه للامتداد .js

export function findById(id) {
  return db("products").where({ id }).first();
}

export function search({ search, sku, categoryId, includeArchived } = {}) {
  const q = db("products").select("*");

  if (search) {
    const s = `%${String(search).trim()}%`;
    q.where(function () {
      this.where("name", "like", s).orWhere("sku", "like", s);
    });
  }

  if (sku) q.where("sku", sku);
  if (categoryId) q.where("category_id", Number(categoryId));

  if (!includeArchived) {
    q.where(function () {
      this.whereNull("archived_at").andWhere("active", 1);
    });
  }

  return q.orderBy("id", "desc");
}

export async function create(dto) {
  const row = {
    name: dto.name,
    sku: dto.sku ?? null,
    price: dto.price ?? null,
    unit: dto.unit || "قطعة",
    category_id: Number(dto.category_id),
    description: dto.description ?? null,
    active: 1,
  };

  const [id] = await db("products").insert(row);
  return findById(id);
}

export async function update(id, dto) {
  const patch = {};
  if (dto.name !== undefined) patch.name = dto.name;
  if (dto.sku !== undefined) patch.sku = dto.sku ?? null;
  if (dto.price !== undefined) patch.price = dto.price ?? null;
  if (dto.unit !== undefined) patch.unit = dto.unit || "قطعة";
  if (dto.category_id !== undefined)
    patch.category_id = Number(dto.category_id);
  if (dto.description !== undefined)
    patch.description = dto.description ?? null;

  if (Object.keys(patch).length === 0) {
    return findById(id);
  }

  await db("products").where({ id }).update(patch);
  return findById(id);
}

export async function setArchived(id, archived) {
  const patch = archived
    ? { active: 0, archived_at: db.fn.now() }
    : { active: 1, archived_at: null };
  await db("products").where({ id }).update(patch);
  return findById(id);
}

export async function setImage(id, { image_url, thumb_url }) {
  await db("products")
    .where({ id })
    .update({
      image_url,
      thumb_url: thumb_url || image_url,
    });
  return findById(id);
}
