export async function up(knex) {
  const has = await knex.schema.hasTable("bootstrap_tokens");
  if (has) return;
  await knex.schema.createTable("bootstrap_tokens", (t) => {
    t.increments("id").primary();
    t.string("token_hash", 128).notNullable().unique();
    t.string("issued_ip", 64).notNullable();
    t.text("issued_ua").notNullable();
    t.dateTime("expires_at").notNullable();
    t.dateTime("used_at").nullable();
    t.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("bootstrap_tokens");
}
