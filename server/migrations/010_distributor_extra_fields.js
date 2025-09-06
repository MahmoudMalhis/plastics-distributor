// 010_distributor_extra_fields.js
export async function up(knex) {
  await knex.schema.alterTable("distributors", (table) => {
    table.string("phone2", 50).nullable();
    table.string("id_image_url", 255).nullable();
    table.string("vehicle_plate", 50).nullable();
    table.string("vehicle_type", 100).nullable();
    table.string("vehicle_model", 100).nullable();
    table.boolean("company_vehicle").defaultTo(false).notNullable();
    table.text("responsible_areas").nullable();
  });
}

export async function down(knex) {
  await knex.schema.alterTable("distributors", (table) => {
    table.dropColumn("phone2");
    table.dropColumn("id_image_url");
    table.dropColumn("vehicle_plate");
    table.dropColumn("vehicle_type");
    table.dropColumn("vehicle_model");
    table.dropColumn("company_vehicle");
    table.dropColumn("responsible_areas");
  });
}
