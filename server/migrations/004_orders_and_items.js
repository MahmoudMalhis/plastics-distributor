// 004_orders_and_items.js
export async function up(knex) {
  await knex.schema.createTable("orders", (table) => {
    table.increments("id");
    table.string("code", 191).notNullable().unique();

    table
      .integer("distributor_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("distributors")
      .onUpdate("CASCADE")
      .onDelete("RESTRICT");

    table
      .integer("created_by")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onUpdate("CASCADE")
      .onDelete("RESTRICT");

    table
      .integer("customer_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("customers")
      .onUpdate("CASCADE")
      .onDelete("SET NULL");

    table
      .enu("status", [
        "draft",
        "submitted",
        "approved",
        "fulfilled",
        "canceled",
      ])
      .notNullable()
      .defaultTo("draft");

    table.decimal("total", 12, 2).notNullable().defaultTo(0);
    table.decimal("discount_amount", 12, 2).notNullable().defaultTo(0);
    table.decimal("discount_percentage", 5, 2).notNullable().defaultTo(0);
    table.text("notes");

    table.enu("payment_method", ["cash", "installments", "checks"]).nullable();
    table.integer("installment_plan_id").unsigned().nullable();
    table.string("check_note", 255);

    table.datetime("submitted_at").nullable();
    table.datetime("approved_at").nullable();
    table.datetime("fulfilled_at").nullable();
    table.datetime("canceled_at").nullable();

    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("order_items", (table) => {
    table.increments("id");
    table
      .integer("order_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("orders")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");

    table
      .integer("product_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("products")
      .onUpdate("CASCADE")
      .onDelete("SET NULL");

    table.integer("qty").unsigned().notNullable();
    table.decimal("unit_price", 12, 2).notNullable();
    table.json("product_snapshot");
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("order_items");
  await knex.schema.dropTableIfExists("orders");
}
