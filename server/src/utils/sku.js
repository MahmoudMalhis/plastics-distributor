// server/src/utils/sku.js
export async function generateSequentialSku(
  knex,
  { table, prefix, column = "sku", pad = 6 }
) {
  // نأخذ أكبر قيمة رقمية بعد البادئة: MAX(CAST(SUBSTRING(sku, LENGTH(prefix)+1) AS UNSIGNED))
  const row = await knex(table)
    .where(column, "like", `${prefix}%`)
    .select(
      knex.raw(`MAX(CAST(SUBSTRING(??, ? ) AS UNSIGNED)) AS maxNum`, [
        column,
        prefix.length + 1,
      ])
    )
    .first();

  const maxNum = Number(row?.maxNum || 0);
  const next = maxNum + 1;
  return `${prefix}${String(next).padStart(pad, "0")}`;
}

/** التوليد الخاص بالمنتجات */
export async function generateProductSku(knex) {
  return generateSequentialSku(knex, { table: "products", prefix: "PRD-" });
}

/** التوليد الخاص بالعملاء */
export async function generateCustomerSku(knex) {
  return generateSequentialSku(knex, { table: "customers", prefix: "CUS-" });
}

export async function generateOrderCode(knex) {
  return generateSequentialSku(knex, {
    table: "orders",
    prefix: "ORD-",
    column: "code",
  });
}
