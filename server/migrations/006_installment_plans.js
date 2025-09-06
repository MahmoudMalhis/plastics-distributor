// 006_installment_plans.js
export async function up(knex) {
  await knex.schema.createTable("installment_plans", (table) => {
    table.increments("id");
    table
      .integer("customer_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("customers")
      .onUpdate("CASCADE")
      .onDelete("RESTRICT");
    table
      .integer("order_id")
      .unsigned()
      .notNullable()
      .unique()
      .references("id")
      .inTable("orders")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
    table.decimal("amount_per_installment", 12, 2).notNullable();
    table.enu("frequency", ["weekly", "monthly"]).notNullable();
    table.date("next_due_date").nullable();
    table
      .enu("status", ["active", "completed", "paused"])
      .notNullable()
      .defaultTo("active");
    table.timestamp("created_at").defaultTo(knex.fn.now());

    table.index(["customer_id"], "installment_plans_customer_idx");
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("installment_plans");
}
