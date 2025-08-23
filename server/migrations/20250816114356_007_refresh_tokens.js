// migrations/007_refresh_tokens.js
// هذه الهجرة تضيف جدولاً لحفظ رموز الإنعاش (refresh tokens) في قاعدة البيانات.
// يتم ربط كل رمز بالمستخدم وتاريخ انتهاء الصلاحية حتى يمكن إبطال الرموز بسهولة
// عند تعطيل حساب المستخدم أو تغيير كلمة مروره.

export async function up(knex) {
  // إذا كان الجدول موجوداً مسبقاً فلا حاجة لإنشائه.
  const hasTable = await knex.schema.hasTable("refresh_tokens");
  if (hasTable) return;

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
    // التخزين الآمن للتوكن يكون عبر تجزئته (hash) وليس الخام
    table.string("token_hash", 191).notNullable().unique();
    table.timestamp("expires_at").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.index(["user_id", "expires_at"], "refresh_tokens_user_exp_idx");
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("refresh_tokens");
}
