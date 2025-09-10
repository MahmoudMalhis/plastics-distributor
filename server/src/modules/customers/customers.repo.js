import db from "../../db/knex.js";

// البحث أو جلب العملاء مع دعم التصفية والصفحات
export async function list({
  search,
  page = 1,
  limit = 20,
  distributor_id,
} = {}) {
  const ordersAgg = db("orders")
    .select("customer_id")
    .count({ orders_count: "*" })
    .groupBy("customer_id")
    .as("o");

  const ledgerAgg = db("ledger_entries")
    .select("customer_id")
    .sum({ debit_sum: "debit" })
    .sum({ credit_sum: "credit" })
    .groupBy("customer_id")
    .as("l");

  const base = db("customers as c")
    .leftJoin(ordersAgg, "o.customer_id", "c.id")
    .leftJoin(ledgerAgg, "l.customer_id", "c.id")
    .modify((qb) => {
      if (distributor_id != null) {
        qb.where("c.distributor_id", Number(distributor_id));
      }
      if (search) {
        const term = String(search).toLowerCase();
        const like = `%${term.replace(/[%_]/g, "\\$&")}%`;
        qb.where((w) => {
          w.whereRaw("LOWER(c.name) LIKE ?", [like])
            .orWhereRaw("LOWER(c.customer_sku) LIKE ?", [like])
            .orWhereRaw("LOWER(c.phone) LIKE ?", [like]);
        });
      }
    })
    .select(
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
      "c.created_at",
      db.raw("COALESCE(o.orders_count, 0) AS orders_count"),
      db.raw("(COALESCE(l.debit_sum,0) - COALESCE(l.credit_sum,0)) AS balance")
    )
    .orderBy("c.name", "asc");

  const take = Math.max(1, Number(limit) || 20);
  const pageNum = Math.max(1, Number(page) || 1);

  const rows = await base
    .clone()
    .limit(take)
    .offset((pageNum - 1) * take);

  const [{ count }] = await db("customers as c")
    .modify((qb) => {
      if (distributor_id != null) {
        qb.where("c.distributor_id", Number(distributor_id));
      }
      if (search) {
        const term = String(search).toLowerCase();
        const like = `%${term.replace(/[%_]/g, "\\$&")}%`;
        qb.where((w) => {
          w.whereRaw("LOWER(c.name) LIKE ?", [like])
            .orWhereRaw("LOWER(c.customer_sku) LIKE ?", [like])
            .orWhereRaw("LOWER(c.phone) LIKE ?", [like]);
        });
      }
    })
    .count({ count: "*" });

  return { rows, total: Number(count || 0) };
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
export async function getDetailsWithDistributor(id) {
  const customer = await db("customers as c")
    .leftJoin("distributors as d", "d.id", "c.distributor_id")
    .select(
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
      "c.created_at",
      db.raw("COALESCE(d.name, NULL) as distributor_name")
    )
    .where("c.id", id)
    .first();

  if (!customer) return null;

  // عدد الطلبات والرصيد كما كان
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

export function getCustomerBasic(id) {
  return db("customers").select("id", "distributor_id").where({ id }).first();
}
export async function getById(id) {
  return db("customers").select("id", "distributor_id").where({ id }).first();
}

export async function getTimeline({ customerId, page = 1, limit = 20 }) {
  const take = Math.max(1, Number(limit));
  const offset = (Math.max(1, Number(page)) - 1) * take;
  const limitPlus = take + 1;

  // نبني سب-كويري مدمج
  const subquery = db
    .select("*")
    .from(function () {
      // فواتير
      this.select(
        db.raw("o.created_at as ts"),
        db.raw("'order' as kind"),
        db.raw("o.id as id"),
        db.raw("o.code as ref"),
        db.raw("o.total as total"),
        db.raw("o.status as status"),
        db.raw("NULL as amount"),
        db.raw("NULL as method"),
        db.raw("NULL as note")
      )
        .from("orders as o")
        .where("o.customer_id", customerId)
        // ندمج معها الدفعات
        .unionAll(function () {
          this.select(
            db.raw("p.received_at as ts"),
            db.raw("'payment' as kind"),
            db.raw("p.id as id"),
            db.raw("CONCAT('PMT-', LPAD(p.id, 6, '0')) as ref"),
            db.raw("NULL as total"),
            db.raw("NULL as status"),
            db.raw("p.amount as amount"),
            db.raw("p.method as method"),
            db.raw("p.note as note")
          )
            .from("payments as p")
            .where("p.customer_id", customerId);
        })
        .as("t");
    })
    .as("timeline");

  const rows = await db
    .select("*")
    .from(subquery)
    .orderBy("ts", "desc")
    .limit(limitPlus)
    .offset(offset);

  return rows;
}
