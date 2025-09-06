// 012_performance_indexes.js
export async function up(knex) {
  await knex.schema.alterTable("products", (table) => {
    table.index(["active", "category_id"], "products_active_cat_idx");
    table.index(["sku"], "products_sku_idx");
  });

  await knex.schema.alterTable("orders", (table) => {
    table.index(["status"], "orders_status_idx");
    table.index(["distributor_id"], "orders_dist_idx");
    table.index(["customer_id"], "orders_cust_idx");
    table.index(["created_at"], "orders_created_idx");
  });

  await knex.schema.alterTable("payments", (table) => {
    table.index(["customer_id"], "payments_cust_idx");
    table.index(["received_at"], "payments_received_idx");
  });

  await knex.schema.alterTable("customers", (table) => {
    table.index(["distributor_id"], "customers_dist_idx");
  });
}

export async function down(knex) {
  await knex.schema.alterTable("customers", (table) => {
    table.dropIndex(["distributor_id"], "customers_dist_idx");
  });

  await knex.schema.alterTable("payments", (table) => {
    table.dropIndex(["customer_id"], "payments_cust_idx");
    table.dropIndex(["received_at"], "payments_received_idx");
  });

  await knex.schema.alterTable("orders", (table) => {
    table.dropIndex(["status"], "orders_status_idx");
    table.dropIndex(["distributor_id"], "orders_dist_idx");
    table.dropIndex(["customer_id"], "orders_cust_idx");
    table.dropIndex(["created_at"], "orders_created_idx");
  });

  await knex.schema.alterTable("products", (table) => {
    table.dropIndex(["active", "category_id"], "products_active_cat_idx");
    table.dropIndex(["sku"], "products_sku_idx");
  });
}
