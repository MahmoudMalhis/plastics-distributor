// server/src/utils/sku.js

// استيراد مثيل قاعدة البيانات
import db from "../db/knex.js";

// الدالة الأساسية لتوليد SKU تسلسلي
async function generateSequentialSkuInternal(
  knexInstance,
  { table, prefix, column = "sku", pad = 6 }
) {
  // نأخذ أكبر قيمة رقمية بعد البادئة
  const row = await knexInstance(table)
    .where(column, "like", `${prefix}%`)
    .select(
      knexInstance.raw(`MAX(CAST(SUBSTRING(??, ?) AS UNSIGNED)) AS maxNum`, [
        column,
        prefix.length + 1,
      ])
    )
    .first();

  const maxNum = Number(row?.maxNum || 0);
  const next = maxNum + 1;
  return `${prefix}${String(next).padStart(pad, "0")}`;
}

// دالة عامة للاستخدام مع knex مُمرر
export async function generateSequentialSku(knex, options) {
  return generateSequentialSkuInternal(knex, options);
}

/** التوليد الخاص بالمنتجات - مع أو بدون knex */
export async function generateProductSku(knex) {
  const knexInstance = knex || db;
  return generateSequentialSkuInternal(knexInstance, {
    table: "products",
    prefix: "PRD-",
  });
}

/** التوليد الخاص بالعملاء - مع أو بدون knex */
export async function generateCustomerSku(knex) {
  const knexInstance = knex || db;
  return generateSequentialSkuInternal(knexInstance, {
    table: "customers",
    prefix: "CUS-",
    column: "customer_sku",
  });
}

/** التوليد الخاص بالطلبات - مع أو بدون knex */
export async function generateOrderCode(knex) {
  const knexInstance = knex || db;
  return generateSequentialSkuInternal(knexInstance, {
    table: "orders",
    prefix: "ORD-",
    column: "code",
  });
}
