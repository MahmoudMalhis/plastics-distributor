import db from "../../db/knex.js";

// البحث أو جلب العملاء مع دعم التصفية والصفحات
export async function list({ search, page, limit } = {}) {
  const qb = db("customers as c").select(
    "c.id",
    "c.name",
    "c.customer_sku",
    "c.phone",
    "c.address",
    "c.notes",
    "c.distributor_id",
    "c.latitude",
    "c.longitude",
    "c.active",
    "c.created_at"
  );
  if (search) {
    const term = String(search).toLowerCase();
    const like = `%${term.replace(/[%_]/g, "\\$&")}%`;
    qb.where((q) => {
      q.whereRaw("LOWER(c.name) LIKE ?", [like]).orWhereRaw(
        "LOWER(c.customer_sku) LIKE ?",
        [like]
      );
    });
  }
  qb.orderBy("c.name", "asc");
  const take = Number(limit) > 0 ? Number(limit) : null;
  const pageNum = Number(page) > 0 ? Number(page) : 1;
  if (take) {
    qb.limit(take).offset((pageNum - 1) * take);
  }
  return qb;
}

// إنشاء عميل جديد
export async function create(dto) {
  const inserted = await db("customers").insert(dto);
  const raw = Array.isArray(inserted) ? inserted[0] : inserted;
  const id = typeof raw === "object" ? raw.insertId ?? raw.id : Number(raw);
  return db("customers").where({ id }).first();
}

// تحديث عميل
export async function update(id, patch) {
  await db("customers").where({ id }).update(patch);
  return db("customers").where({ id }).first();
}

// إرجاع معلومات تفصيلية للعميل (عدد الطلبات والرصيد)
export async function getDetails(id) {
  const customer = await db("customers as c")
    .leftJoin("distributors as d", "d.id", "c.distributor_id") // ✅ انضمام لجلب الاسم
    .select(
      "c.id",
      "c.name",
      "c.customer_sku",
      "c.phone",
      "c.address",
      "c.notes",
      "c.distributor_id",
      db.raw("COALESCE(d.name, '') as distributor_name"), // ✅ اسم الموزّع
      "c.latitude",
      "c.longitude",
      "c.active",
      "c.created_at"
    )
    .where("c.id", id)
    .first();

  if (!customer) return null;

  const orderCountRow = await db("orders")
    .where({ customer_id: id })
    .count({ count: "id" })
    .first();
  const ordersCount = Number(orderCountRow?.count ?? 0);

  const ledgerRow = await db("ledger_entries")
    .where({ customer_id: id })
    .sum({ debit: "debit" })
    .sum({ credit: "credit" })
    .first();
  const debit = Number(ledgerRow?.debit ?? 0);
  const credit = Number(ledgerRow?.credit ?? 0);
  const balance = debit - credit;

  const orders = await db("orders")
    .select("id", "code", "status", "total", "created_at")
    .where({ customer_id: id })
    .orderBy("created_at", "desc");

  return { ...customer, ordersCount, balance, orders };
}

// نقل كل عملاء موزّع إلى موزّع آخر
export async function bulkReassign(fromDistributorId, toDistributorId) {
  if (!fromDistributorId || !toDistributorId) return 0;
  return db("customers")
    .where({ distributor_id: fromDistributorId })
    .update({ distributor_id: toDistributorId });
}

export async function getById(id) {
  return db("customers").select("id", "distributor_id").where({ id }).first();
}

export async function getTimeline(customerId, { page = 1, limit = 50 } = {}) {
  const take = Math.max(1, Math.min(200, Number(limit) || 50));
  const skip = Math.max(0, (Number(page) || 1) - 1) * take;

  const orders = await db("orders")
    .select(
      db.raw("'order' as kind"),
      "id as ref_id",
      "code",
      "status",
      "total as amount",
      "created_at"
    )
    .where({ customer_id: customerId });

  const payments = await db("payments")
    .select(
      db.raw("'payment' as kind"),
      "id as ref_id",
      "order_id",
      "method",
      "note",
      "amount",
      db.raw("COALESCE(received_at, created_at) as created_at")
    )
    .where({ customer_id: customerId });

  const events = [...orders, ...payments]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(skip, skip + take);

  return { items: events, page, limit: take };
}
