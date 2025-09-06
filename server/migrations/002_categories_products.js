// 002_categories_products.js
export async function up(knex) {
  await knex.schema.createTable("categories", (table) => {
    table.increments("id");
    table.string("name", 191).notNullable().unique();
    table
      .integer("parent_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("categories")
      .onUpdate("CASCADE")
      .onDelete("SET NULL");
  });

  await knex.schema.createTable("products", (table) => {
    table.increments("id");
    table.string("name", 191).notNullable();
    table.string("sku", 191).notNullable().unique();
    table.decimal("price", 12, 2).notNullable().defaultTo(0);
    table.string("unit", 50).notNullable();
    table
      .integer("category_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("categories")
      .onUpdate("CASCADE")
      .onDelete("RESTRICT");
    table.string("image_url", 255);
    table.string("thumb_url", 255);
    table.text("description");
    table.boolean("active").notNullable().defaultTo(true);
    table.timestamp("archived_at").nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("products");
  await knex.schema.dropTableIfExists("categories");
}
