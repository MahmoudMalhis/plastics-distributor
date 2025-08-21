// migrations/005_payments_installments_ledger.js
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
  });

  await knex.schema.createTable("payments", (table) => {
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
      .nullable()
      .references("id")
      .inTable("orders")
      .onUpdate("CASCADE")
      .onDelete("SET NULL");
    table.decimal("amount", 12, 2).notNullable();
    table.enu("method", ["cash", "transfer", "check"]).notNullable();
    table.text("note");
    table.timestamp("received_at").defaultTo(knex.fn.now());
    table
      .integer("created_by")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onUpdate("CASCADE")
      .onDelete("RESTRICT");
  });

  await knex.schema.createTable("ledger_entries", (table) => {
    table.increments("id");
    table
      .integer("customer_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("customers")
      .onUpdate("CASCADE")
      .onDelete("RESTRICT");
    table.enu("ref_type", ["order", "payment", "adjustment"]).notNullable();
    table.integer("ref_id").unsigned().notNullable();
    table.decimal("debit", 12, 2).notNullable().defaultTo(0); // يزيد رصيد العميل
    table.decimal("credit", 12, 2).notNullable().defaultTo(0); // ينقص رصيد العميل
    table.decimal("balance_after", 12, 2).notNullable().defaultTo(0);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.index(["customer_id", "created_at"]);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("ledger_entries");
  await knex.schema.dropTableIfExists("payments");
  await knex.schema.dropTableIfExists("installment_plans");
}
