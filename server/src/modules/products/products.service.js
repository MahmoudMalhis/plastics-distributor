// src/modules/products/products.service.js
import db from "../../db/knex.js";
import { generateProductSku } from "./sku.util.js";
import { setImage as repoSetImage } from "./products.repo.js"; // سنستخدمها لتحديث مسارات الصورة

// ✅ إرجاع قائمة المنتجات مع الفلاتر (وبدون إظهار المؤرشف/غير النشط لغير الأدمن)
export async function list({
  search,
  categoryId,
  includeArchived,
  page,
  limit,
  sort,
  user,
} = {}) {
  const qb = db("products").select(
    "id",
    "name",
    "sku",
    "price",
    "unit",
    "category_id",
    "image_url",
    "thumb_url",
    "description",
    "active",
    "archived_at"
  );

  const isAdmin = user?.role === "admin";

  const showArchivedOnly =
    includeArchived === true ||
    includeArchived === "true" ||
    includeArchived === 1 ||
    includeArchived === "1";

  if (showArchivedOnly) {
    qb.whereNotNull("archived_at");
  } else {
    qb.where({ active: 1 }).whereNull("archived_at");
  }

  if (categoryId) qb.andWhere("category_id", Number(categoryId));

  if (search) {
    // بحث case‑insensitive مع هروب % و _
    const term = String(search).toLowerCase();
    const like = `%${term.replace(/[%_]/g, "\\$&")}%`;
    qb.andWhere((q) => {
      q.whereRaw("LOWER(`name`) LIKE ?", [like]).orWhereRaw(
        "LOWER(`sku`) LIKE ?",
        [like]
      );
    });
  }

  switch (String(sort || "").toLowerCase()) {
    case "latest":
      // الأحدث: حسب تاريخ/معرّف الإدخال
      qb.orderBy("id", "desc");
      break;
    case "price_asc":
      qb.orderBy([
        { column: "price", order: "asc" },
        { column: "name", order: "asc" },
      ]);
      break;
    case "price_desc":
      qb.orderBy([
        { column: "price", order: "desc" },
        { column: "name", order: "asc" },
      ]);
      break;
    case "name":
      qb.orderBy("name", "asc");
      break;
    default:
      qb.orderBy("name", "asc");
  }
  const take = Number(limit) > 0 ? Number(limit) : null;
  const pageNum = Number(page) > 0 ? Number(page) : 1;
  if (take) qb.limit(take).offset((pageNum - 1) * take);

  return qb; // Knex ثمابل؛ سيرجِع Array عند await
}

// موجودة لديك بالفعل لكن أضعها هنا للاتساق
export async function create(dto) {
  const name = String(dto?.name || "").trim();
  const unit = String(dto?.unit || "وحدة").trim();
  const category_id = Number(dto?.category_id);
  const description = dto?.description ? String(dto.description) : null;
  const price =
    dto?.price === "" || dto?.price == null ? null : Number(dto.price);

  if (!name) throw new Error("name required");
  if (!category_id) throw new Error("category_id required");

  let sku = dto?.sku ? String(dto.sku).trim() : "";
  if (!sku) sku = await generateProductSku(db);

  const toInsert = {
    name,
    sku,
    price,
    unit,
    category_id,
    description,
    active: 1,
    created_at: db.fn.now(),
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const inserted = await db("products").insert(toInsert);
      const raw = Array.isArray(inserted) ? inserted[0] : inserted;
      const id = typeof raw === "object" ? raw.insertId ?? raw.id : Number(raw);
      return db("products").where({ id }).first();
    } catch (e) {
      if (e?.code === "ER_DUP_ENTRY" && String(e?.message).includes("sku")) {
        sku = await generateProductSku(db);
        toInsert.sku = sku;
        continue;
      }
      throw e;
    }
  }
  throw new Error("failed to generate unique SKU");
}

export async function update(id, dto) {
  if (!id) throw new Error("id required");
  const patch = {
    name: dto?.name,
    sku: dto?.sku,
    unit: dto?.unit,
    category_id: dto?.category_id ? Number(dto.category_id) : undefined,
    description: dto?.description ?? null,
    price: dto?.price === "" || dto?.price == null ? null : Number(dto.price),
  };
  Object.keys(patch).forEach((k) => patch[k] === undefined && delete patch[k]);

  await db("products").where({ id }).update(patch);
  return db("products").where({ id }).first();
}

export function archive(id) {
  return db("products")
    .where({ id })
    .update({ active: 0, archived_at: db.fn.now() });
}

export function restore(id) {
  return db("products").where({ id }).update({ active: 1, archived_at: null });
}

// اختياري: ربط الصورة بالمنتج (بسيطة بدون توليد thumbnail لتجنّب تبعية sharp)
export async function attachImage(id, filePath) {
  // بناء المسار الكامل للصورة
  const image_url = `/uploads/products/${filePath.split(/[/\\]/).pop()}`;

  await repoSetImage(id, { image_url, thumb_url: null });
  return { image_url, thumb_url: null };
}

export async function getById(id, { user } = {}) {
  const row = await db("products as p")
    .leftJoin("categories as c", "c.id", "p.category_id")
    .select(
      "p.id",
      "p.name",
      "p.sku",
      "p.price",
      "p.unit",
      "p.category_id",
      "p.image_url",
      "p.thumb_url",
      "p.description",
      "p.active",
      "p.archived_at",
      db.raw("COALESCE(c.name, '') as category_name")
    )
    .where("p.id", Number(id))
    .first();

  if (!row) return null;

  // الموزّع لا يرى غير الفعال/المؤرشف
  const isAdmin = user?.role === "admin";
  if (!isAdmin && (row.active !== 1 || row.archived_at)) {
    return null;
  }
  return row;
}
