export async function up(knex) {
  await knex.schema.alterTable("customers", (table) => {
    // ربط العميل بموزع (nullable)
    table
      .integer("distributor_id")
      .unsigned()
      .references("id")
      .inTable("distributors")
      .onDelete("SET NULL");

    // إحداثيات الموقع (خط العرض وخط الطول)
    table.decimal("latitude", 10, 6);
    table.decimal("longitude", 10, 6);
  });
}

export async function down(knex) {
  await knex.schema.alterTable("customers", (table) => {
    table.dropColumn("distributor_id");
    table.dropColumn("latitude");
    table.dropColumn("longitude");
  });
}
