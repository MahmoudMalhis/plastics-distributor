// server/migrations/014_fix_installment_plans.js
export async function up(knex) {
  // تحقق من وجود حقل first_payment_amount
  const hasFirstPayment = await knex.schema.hasColumn(
    "installment_plans",
    "first_payment_amount"
  );

  if (!hasFirstPayment) {
    await knex.schema.alterTable("installment_plans", (table) => {
      table
        .decimal("first_payment_amount", 12, 2)
        .nullable()
        .after("amount_per_installment");
      table
        .decimal("total_amount", 12, 2)
        .nullable()
        .after("first_payment_amount");
      table.decimal("remaining_amount", 12, 2).nullable().after("total_amount");
      table
        .integer("total_installments")
        .unsigned()
        .nullable()
        .after("remaining_amount");
      table
        .integer("paid_installments")
        .unsigned()
        .defaultTo(0)
        .after("total_installments");
    });
  }
}

export async function down(knex) {
  await knex.schema.alterTable("installment_plans", (table) => {
    table.dropColumn("first_payment_amount");
    table.dropColumn("total_amount");
    table.dropColumn("remaining_amount");
    table.dropColumn("total_installments");
    table.dropColumn("paid_installments");
  });
}
