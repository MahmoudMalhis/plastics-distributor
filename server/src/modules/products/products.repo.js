import knex from "../../db.js";

export function findById(id) {
  return knex("products").where({ id }).first();
}

export function search({ search, sku, categoryId, includeArchived } = {}) {
  const q = knex("products").select("*");

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

  q.orderBy("id", "desc");
  return q;
}

export async function create(dto) {
  const row = {
    name: dto.name,
    sku: dto.sku || null,
    price: dto.price ?? null,
    unit: dto.unit || "قطعة",
    category_id: Number(dto.category_id),
    description: dto.description || null,
    active: 1,
  };

  const [id] = await knex("products").insert(row);
  return findById(id);
}

export async function update(id, dto) {
  await knex("products")
    .where({ id })
    .update({
      name: dto.name,
      sku: dto.sku || null,
      price: dto.price ?? null,
      unit: dto.unit || "قطعة",
      category_id: dto.category_id ? Number(dto.category_id) : undefined,
      description: dto.description ?? null,
    });
  return findById(id);
}

export async function setArchived(id, archived) {
  const patch = archived
    ? { active: 0, archived_at: knex.fn.now() }
    : { active: 1, archived_at: null };
  await knex("products").where({ id }).update(patch);
  return findById(id);
}

export function setImage(id, { image_url, thumb_url }) {
  return knex("products")
    .where({ id })
    .update({
      image_url,
      thumb_url: thumb_url || image_url, // استخدام نفس الصورة ك thumbnail إذا لم يتم توفير واحدة
    });
}
