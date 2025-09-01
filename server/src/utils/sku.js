// server/src/utils/sku.js

// يحوّل رقم إلى 6 خانات: 15 => "000015"
function pad6(n) {
  return String(n).padStart(6, "0");
}

/**
 * توليد SKU للمنتج بصيغة PRD-000001
 * يقدّر nextId من MAX(id)+1 لتفادي NOT NULL/UNIQUE قبل الإدراج.
 * قد يحدث سباق نادر جدًا في الازدحام العالي — يكفي لحالتنا.
 */
export async function generateProductSku(knex) {
  const row = await knex("products").max({ m: "id" }).first();
  const nextId = Number(row?.m || 0) + 1;
  return `PRD-${pad6(nextId)}`;
}

/**
 * توليد SKU للعميل: CUS-000001 (احتياطي لو احتجته لاحقًا)
 */
export async function generateCustomerSku(knex) {
  const row = await knex("customers").max({ m: "id" }).first();
  const nextId = Number(row?.m || 0) + 1;
  return `CUS-${pad6(nextId)}`;
}

export async function generateOrderCode(knex) {
  const row = await knex("orders").max({ m: "id" }).first();
  const nextId = Number(row?.m || 0) + 1;
  return `ORD-${pad6(nextId)}`;
}
