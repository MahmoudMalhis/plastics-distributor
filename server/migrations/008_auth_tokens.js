// 008_auth_tokens.js
export async function up(knex) {
  await knex.schema.createTable("password_set_tokens", (table) => {
    table.increments("id");
    table
      .integer("user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
    table.string("token_hash", 191).notNullable();
    table.timestamp("expires_at").notNullable();
    table.timestamp("used_at").nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.index(["user_id", "expires_at"]);
    table.index(["token_hash"], "pst_hash_idx");
  });

  await knex.schema.createTable("refresh_tokens", (table) => {
    table.increments("id");
    table
      .integer("user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
    table.string("token_hash", 191).notNullable().unique();
    table.timestamp("expires_at").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.index(["user_id", "expires_at"], "refresh_tokens_user_exp_idx");
  });

  await knex.schema.createTable("bootstrap_tokens", (table) => {
    table.increments("id").primary();
    table.string("token_hash", 128).notNullable().unique();
    table.string("issued_ip", 64).notNullable();
    table.text("issued_ua").notNullable();
    table.dateTime("expires_at").notNullable();
    table.dateTime("used_at").nullable();
    table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
    table.index(["expires_at", "used_at"], "bootstrap_exp_used_idx");
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("bootstrap_tokens");
  await knex.schema.dropTableIfExists("refresh_tokens");
  await knex.schema.dropTableIfExists("password_set_tokens");
}
