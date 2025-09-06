// 001_init_users_distributors.js
export async function up(knex) {
  await knex.schema.createTable("distributors", (table) => {
    table.increments("id");
    table.string("name", 191).notNullable().unique();
    table.string("phone", 50);
    table.string("address", 255);
    table.text("notes");
    table.boolean("active").notNullable().defaultTo(true);
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("users", (table) => {
    table.increments("id");
    table.string("username", 191).notNullable().unique();
    table.string("password_hash", 191).notNullable();
    table.enu("role", ["admin", "distributor"]).notNullable();
    table
      .integer("distributor_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("distributors")
      .onUpdate("CASCADE")
      .onDelete("SET NULL");
    table.boolean("must_change_password").notNullable().defaultTo(false);
    table.boolean("active").notNullable().defaultTo(true);
    table.timestamp("last_login_at").nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("users");
  await knex.schema.dropTableIfExists("distributors");
}
