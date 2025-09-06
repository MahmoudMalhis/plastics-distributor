// 007_order_revisions.js
export async function up(knex) {
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
}
