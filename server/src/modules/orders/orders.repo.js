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

      const raw = Array.isArray(inserted) ? inserted[0] : inserted;
      const id = typeof raw === "object" ? raw.insertId ?? raw.id : Number(raw);
      return getOrderById(id);
    } catch (err) {
      const isDup =
        err?.code === "ER_DUP_ENTRY" ||
        /duplicate entry/i.test(err?.sqlMessage || err?.message || "");
      if (isDup && tries < 3) {
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

export function listOrders(opts) {
  return searchOrdersRepo({ ...opts, withItems: false, orderBy: "o.id" });
}

export async function insertItems(items) {
  if (!items?.length) return [];
  const rows = await db("order_items").insert(items);
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
      db.raw(`
      COALESCE(
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(oi.product_snapshot, '$.sku')), ''),
        p.sku
      ) AS sku
    `),
      db.raw(`
      COALESCE(
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(oi.product_snapshot, '$.image')), ''),
        p.image_url
      ) AS image
    `),
      "oi.qty",
      "oi.unit_price",
      "oi.product_snapshot"
    )
    .where("oi.order_id", orderId);
}

export async function getProductById(id) {
  return db("products").where({ id }).first();
}

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
  const inserted = await db("order_revisions").insert(payload);
  const id = Array.isArray(inserted) ? inserted[0] : inserted;

  return db("order_revisions").where({ id }).first();
}

export async function listRevisions(orderId) {
  return db("order_revisions as r")
    .leftJoin("users as u", "u.id", "r.editor_user_id")
    .select("r.id", "r.reason", "r.created_at", "u.username")
    .where("r.order_id", orderId)
    .orderBy("r.id", "desc");
}

export async function createInstallmentPlan(data = {}) {
  const planData = {
    customer_id: data.customer_id ?? null,
    order_id: data.order_id ?? null,
    amount_per_installment: Number(data.amount || 0),
    frequency: data.frequency || data.period || "monthly",
    status: data.status || "active",
    next_due_date: data.next_due_date ?? null,
    total_amount: data.total_amount ?? null,
    remaining_amount: data.remaining_amount ?? null,
    total_installments: data.total_installments ?? null,
    paid_installments: data.paid_installments ?? 0,
    first_payment_amount: data.first_payment_amount ?? null,
    created_at: db.fn.now(),
  };

  try {
    const inserted = await db("installment_plans").insert(planData);
    const id = Array.isArray(inserted) ? inserted[0] : inserted;
    return db("installment_plans").where({ id }).first();
  } catch (e) {
    console.error("Error creating installment plan:", e);
    throw e;
  }
}

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

export function listOrdersByCustomer(customerId, opts) {
  return searchOrdersRepo({
    ...opts,
    customer_id: customerId,
    withItems: false,
    orderBy: "o.created_at",
  });
}

function baseOrdersQuery() {
  return db("orders as o")
    .leftJoin("customers as c", "c.id", "o.customer_id")
    .select(
      "o.id",
      "o.code",
      "o.created_at",
      "o.status",
      "o.total",
      "o.customer_id",
      "o.payment_method",
      "o.check_note",
      "o.installment_plan_id",
      "c.name as customer_name"
    );
}

function withPaymentAndPlan(qb) {
  const payAgg = db("payments")
    .select("order_id")
    .sum({ total_paid: "amount" })
    .groupBy("order_id")
    .as("p");

  qb.leftJoin(payAgg, "p.order_id", "o.id")
    .leftJoin("installment_plans as ip", "ip.id", "o.installment_plan_id")
    .select(
      db.raw("COALESCE(p.total_paid, 0) as total_paid"),
      db.raw(`
       GREATEST(
         COALESCE(o.total,0)
           - (COALESCE(o.total,0) * COALESCE(o.discount_percentage,0) / 100.0)
           - COALESCE(o.discount_amount,0),
         0
       ) AS payable_total
     `),
      db.raw(`
       GREATEST(
         (
           COALESCE(o.total,0)
           - (COALESCE(o.total,0) * COALESCE(o.discount_percentage,0) / 100.0)
           - COALESCE(o.discount_amount,0)
         ) - COALESCE(p.total_paid,0),
         0
       ) AS remaining_amount
     `),
      "ip.amount_per_installment as installment_amount",
      "ip.frequency as installment_period"
    );

  return qb;
}

export async function searchOrdersRepo({
  search,
  page = 1,
  limit = 20,
  distributor_id,
  customer_id,
  status,
  includeDrafts = false,
  orderBy = "o.id",
  orderDir = "desc",
  withItems = false,
} = {}) {
  let qb = withPaymentAndPlan(baseOrdersQuery())
    .modify((q) => {
      if (distributor_id) q.where("o.distributor_id", distributor_id);
      if (customer_id) q.where("o.customer_id", customer_id);
      if (status) q.where("o.status", status);
      else if (!includeDrafts) q.whereNot("o.status", "draft");
      if (search) {
        q.where((w) => {
          w.where("c.name", "like", `%${search}%`)
            .orWhere("o.code", "like", `%${search}%`)
            .orWhere("o.id", Number(search) || -1);
        });
      }
    })
    .orderBy(orderBy, orderDir);

  const rows = await qb
    .clone()
    .offset((page - 1) * limit)
    .limit(limit);
  const [{ count }] = await qb.clone().clearSelect().count({ count: "*" });

  let resultRows = rows;

  if (withItems) {
    const itemsOf = async (orderId) =>
      db("order_items as oi")
        .leftJoin("products as p", "p.id", "oi.product_id")
        .where("oi.order_id", orderId)
        .select(
          "oi.product_id",
          "p.name as product_name",
          db.raw(`
            COALESCE(
              NULLIF(JSON_UNQUOTE(JSON_EXTRACT(oi.product_snapshot, '$.sku')), ''),
              p.sku
            ) AS sku
          `),
          db.raw(`
            COALESCE(
              NULLIF(JSON_UNQUOTE(JSON_EXTRACT(oi.product_snapshot, '$.image')), ''),
              p.image_url
            ) AS image
          `),
          "oi.qty",
          "oi.unit_price"
        );

    resultRows = await Promise.all(
      rows.map(async (o) => {
        const items = await itemsOf(o.id);
        return { ...o, items, items_count: items.length };
      })
    );
  }

  return { rows: resultRows, total: Number(count || 0) };
}
