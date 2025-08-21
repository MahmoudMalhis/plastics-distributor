// migrations/006_auth_tokens_and_push.js
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
  });

  await knex.schema.createTable("push_subscriptions", (table) => {
    table.increments("id");
    table
      .integer("user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");

    table.text("endpoint").notNullable();

    table.string("endpoint_hash", 64).notNullable();

    table.text("p256dh").notNullable();
    table.text("auth").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());

    table.unique(["user_id", "endpoint_hash"], "push_user_endpointhash_unique");
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("push_subscriptions");
  await knex.schema.dropTableIfExists("password_set_tokens");
}
