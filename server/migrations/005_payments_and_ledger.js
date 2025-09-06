// 005_payments_and_ledger.js
export async function up(knex) {
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
}
