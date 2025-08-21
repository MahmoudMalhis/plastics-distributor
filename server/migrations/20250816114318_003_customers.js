// migrations/003_customers.js
export async function up(knex) {
  await knex.schema.createTable("customers", (table) => {
    table.increments("id");
    table.string("name", 191).notNullable();
    table.string("customer_sku", 191).notNullable().unique();
    table.string("phone", 50);
    table.string("address", 255);
    table.text("notes");
    table.boolean("active").notNullable().defaultTo(true);
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("customers");
}
