export async function up(knex) {
  await knex.schema.createTable("orders", (t) => {
    t.increments("id");
    t.string("code", 191).notNullable().unique();

    t.integer("distributor_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("distributors")
      .onUpdate("CASCADE")
      .onDelete("RESTRICT");

    t.integer("created_by")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onUpdate("CASCADE")
      .onDelete("RESTRICT");

    t.integer("customer_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("customers")
      .onUpdate("CASCADE")
      .onDelete("SET NULL");

    t.enu("status", ["draft", "submitted", "approved", "fulfilled", "canceled"])
      .notNullable()
      .defaultTo("draft");

    t.decimal("total", 12, 2).notNullable().defaultTo(0);
    t.text("notes");

    t.enu("payment_method", ["cash", "installments", "checks"]).nullable();
    t.integer("installment_plan_id").unsigned().nullable();
    t.string("check_note", 255);

    t.datetime("submitted_at").nullable();
    t.datetime("approved_at").nullable();
    t.datetime("fulfilled_at").nullable();
    t.datetime("canceled_at").nullable();

    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("order_items", (t) => {
    t.increments("id");
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

  await knex.schema.createTable("order_revisions", (table) => {
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
      .integer("editor_user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onUpdate("CASCADE")
      .onDelete("RESTRICT");

    table.text("reason").notNullable();
    table.json("change_set");
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("order_revisions");
  await knex.schema.dropTableIfExists("order_items");
  await knex.schema.dropTableIfExists("orders");
}
