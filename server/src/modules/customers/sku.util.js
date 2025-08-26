import db from "../../db/knex.js";

export async function generateCustomerSku(knexInstance = db) {
  const last = await knexInstance("customers")
    .where("customer_sku", "like", "CUS-%")
    .orderBy("id", "desc")
    .first("customer_sku");

  let nextNumber = 1;
  if (last && last.customer_sku) {
    const match = last.customer_sku.match(/CUS-(\d+)/);
    if (match) {
      nextNumber = Number(match[1]) + 1;
    }
  }
  return `CUS-${String(nextNumber).padStart(6, "0")}`;
}
