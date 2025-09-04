// server/src/utils/sku.js
// مولّد SKU موحد يعتمد على أقصى رقم لاحقة موجودة حالياً لنفس الـ prefix
// مثال الشكل: PRD-000001 , CUS-000123 , ORD-000045

/**
 * يبني SKU متسلسل لشكل PREFIX-000001
 * @param {import('knex').Knex} knex
 * @param {object} opts
 * @param {string} opts.table      - اسم الجدول
 * @param {string} opts.prefix     - البادئة، مثل "PRD-"
 * @param {string} [opts.column=sku] - اسم عمود الـSKU
 * @param {number} [opts.pad=6]    - عدد الخانات مع الصفر
 */
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

/** كود الطلبات (إن كنت تخزّنه في عمود sku أو code مشابه) */
export async function generateOrderCode(knex) {
  // NOTE: غيّر column: "code" لو عمودك اسمه code وليس sku
  return generateSequentialSku(knex, {
    table: "orders",
    prefix: "ORD-",
    column: "code",
  });
}
