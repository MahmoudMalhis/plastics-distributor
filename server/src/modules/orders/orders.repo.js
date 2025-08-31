import db from "../../db/knex.js";

// ====== أوامر أساسية على الطلب ======
export async function createOrder(order) {
  const [row] = await db("orders").insert(order).returning("*");
  const created =
    row || (await db("orders").where(order).orderBy("id", "desc").first()); // SQLite fallback
  // توليد code إذا كان العمود موجودًا ويُراد تعبئته
  if (created && !created.code) {
    const code = `ORD-${String(created.id).padStart(6, "0")}`;
    await db("orders").where({ id: created.id }).update({ code });
    created.code = code;
  }
  return created;
}

export async function updateOrder(id, patch) {
  await db("orders")
    .where({ id })
    .update({ ...patch, updated_at: db.fn.now() });
  return getOrderById(id);
}

export async function getOrderById(id) {
  return db("orders").where({ id }).first();
}

export async function listOrders({
  search,
  page = 1,
  limit = 20,
  distributor_id,
}) {
  const base = db("orders as o")
    .leftJoin("customers as c", "c.id", "o.customer_id")
    .select(
      "o.id",
      "o.code",
      "o.created_at",
      "o.status",
      "o.total",
      "o.customer_id",
      "c.name as customer_name"
    )
    .modify((qb) => {
      if (distributor_id) qb.where("o.distributor_id", distributor_id);
      if (search) {
        qb.where((w) => {
          w.where("c.name", "like", `%${search}%`)
            .orWhere("o.code", "like", `%${search}%`)
            .orWhere("o.id", Number(search) || -1);
        });
      }
    })
    .orderBy("o.id", "desc");

  const rows = await base
    .clone()
    .offset((page - 1) * limit)
    .limit(limit);
  const [{ count }] = await base.clone().clearSelect().count({ count: "*" });
  return { rows, total: Number(count || 0) };
}

// ====== عناصر الطلب ======
export async function insertItems(items) {
  if (!items?.length) return [];
  const rows = await db("order_items").insert(items).returning("*");
  if (Array.isArray(rows) && rows.length) return rows;
  // SQLite fallback
  const orderId = items[0].order_id;
  return db("order_items").where({ order_id: orderId });
}

export async function deleteItemsByOrder(orderId) {
  return db("order_items").where({ order_id: orderId }).del();
}

export async function listItems(orderId) {
  return db("order_items as oi")
    .leftJoin("products as p", "p.id", "oi.product_id")
    .select(
      "oi.id",
      "oi.product_id",
      "p.name as product_name",
      "oi.qty",
      "oi.unit_price",
      "oi.product_snapshot"
    )
    .where("oi.order_id", orderId);
}

export async function getProductById(id) {
  return db("products").where({ id }).first();
}

// ====== مراجعات ======
export async function insertRevision({
  order_id,
  editor_user_id,
  reason,
  change_set,
}) {
  const payload = {
    order_id,
    editor_user_id: editor_user_id ?? null,
    reason,
    change_set: change_set ? JSON.stringify(change_set) : null,
  };
  const [row] = await db("order_revisions").insert(payload).returning("*");
  return (
    row ||
    db("order_revisions").where({ order_id }).orderBy("id", "desc").first()
  );
}

export async function listRevisions(orderId) {
  return db("order_revisions as r")
    .leftJoin("users as u", "u.id", "r.editor_user_id")
    .select("r.id", "r.reason", "r.created_at", "u.username")
    .where("r.order_id", orderId)
    .orderBy("r.id", "desc");
}

// ====== Installment plan (اختياري: إنشاء خطة عند الدفع بالتقسيط) ======
export async function createInstallmentPlan({ amount, period }) {
  // عدّل أسماء الأعمدة حسب جدولك إن اختلفت
  const [row] = await db("installment_plans")
    .insert({
      amount: Number(amount),
      period: String(period),
      created_at: db.fn.now(),
    })
    .returning("*");
  return (
    row ||
    db("installment_plans")
      .where({ amount: Number(amount), period: String(period) })
      .orderBy("id", "desc")
      .first()
  );
}

// ====== تجميع كامل للطلب ======
export async function getOrderFull(id) {
  const order = await getOrderById(id);
  if (!order) return null;
  const [items, revisions, customer] = await Promise.all([
    listItems(id),
    listRevisions(id),
    order.customer_id
      ? db("customers").where({ id: order.customer_id }).first()
      : null,
  ]);
  return {
    order,
    items,
    revisions,
    customer: customer
      ? { id: customer.id, name: customer.name, phone: customer.phone }
      : null,
  };
}
