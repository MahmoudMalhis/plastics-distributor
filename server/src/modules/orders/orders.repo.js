import db from "../../db/knex.js";
import { generateOrderCode } from "../../utils/sku.js";

// ====== أوامر أساسية على الطلب ======
export async function createOrder(order) {
  let tries = 0;
  while (true) {
    tries++;
    try {
      const code = await generateOrderCode(db);
      const inserted = await db("orders").insert({ ...order, code });

      let id = Array.isArray(inserted) ? inserted[0] : inserted?.id;
      if (!id) {
        const row = await db("orders")
          .select("id")
          .orderBy("id", "desc")
          .first();
        id = row?.id;
      }
      return getOrderById(id);
    } catch (err) {
      // في MySQL
      const isDup =
        err?.code === "ER_DUP_ENTRY" ||
        /duplicate entry/i.test(err?.sqlMessage || err?.message || "");
      if (isDup && tries < 3) {
        // جرّب توليد كود جديد مرة أو مرتين
        continue;
      }
      console.error("Error creating order:", err);
      throw err;
    }
  }
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

export async function deleteOrderCascade(orderId) {
  return db.transaction(async (trx) => {
    await trx("order_items").where({ order_id: orderId }).del();
    await trx("order_revisions").where({ order_id: orderId }).del();
    await trx("orders").where({ id: orderId }).del();
  });
}

export async function listOrders({
  search,
  page = 1,
  limit = 20,
  distributor_id,
  status,
  includeDrafts,
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
      if (status) qb.where("o.status", status);
      else if (!includeDrafts) qb.whereNot("o.status", "draft");
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
export async function createInstallmentPlan(data = {}) {
  const base = {
    amount: Number(data.amount),
    period: String(data.period),
    created_at: db.fn.now(),
  };
  // حقول اختيارية — تُحفظ فقط إن وُجدت الأعمدة
  const extended = {
    ...base,
    order_id: data.order_id ?? null,
    customer_id: data.customer_id ?? null,
    status: data.status ?? "active",
    next_due_date: data.next_due_date ?? null,
    remaining_amount:
      data.remaining_amount != null ? Number(data.remaining_amount) : null,
    paid_installments:
      data.paid_installments != null ? Number(data.paid_installments) : null,
    frequency: data.frequency ?? data.period ?? null,
  };
  try {
    const [row] = await db("installment_plans").insert(extended).returning("*");
    if (row) return row;
  } catch (e) {
    if (String(e?.code) !== "ER_BAD_FIELD_ERROR") throw e;
    // fallback لأعمدة قليلة
    const [row] = await db("installment_plans").insert(base).returning("*");
    if (row) return row;
  }
  // SQLite/MySQL قد لا يعيد returning(*)
  const created = await db("installment_plans")
    .where({ amount: Number(base.amount), period: String(base.period) })
    .orderBy("id", "desc")
    .first();
  return created;
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

export async function listOrdersByCustomer(
  customerId,
  { page = 1, limit = 20, status } = {}
) {
  const base = db("orders as o")
    .leftJoin("order_items as oi", "oi.order_id", "o.id")
    .leftJoin("products as p", "p.id", "oi.product_id")
    .where("o.customer_id", customerId)
    .select(
      "o.id",
      "o.code",
      "o.created_at",
      "o.status",
      "o.total",
      "o.payment_method",
      "o.notes",
      db.raw("COUNT(DISTINCT oi.id) as items_count"),
      db.raw(`
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'product_id', oi.product_id,
            'product_name', p.name,
            'qty', oi.qty,
            'unit_price', oi.unit_price
          )
        ) as items
      `)
    )
    .groupBy("o.id")
    .modify((qb) => {
      if (status) qb.where("o.status", status);
    })
    .orderBy("o.created_at", "desc");

  const rows = await base
    .clone()
    .offset((page - 1) * limit)
    .limit(limit);

  const [{ count }] = await db("orders")
    .where({ customer_id: customerId })
    .modify((qb) => {
      if (status) qb.where("status", status);
    })
    .count({ count: "*" });

  return {
    rows: rows.map((row) => ({
      ...row,
      items: row.items ? JSON.parse(row.items) : [],
    })),
    total: Number(count || 0),
  };
}
