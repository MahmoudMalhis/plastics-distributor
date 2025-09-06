// 013_constraints.js
export async function up(knex) {
  await knex.raw(`
    ALTER TABLE orders
    MODIFY COLUMN updated_at TIMESTAMP NOT NULL
    DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
  `);

  await knex.raw(
    `ALTER TABLE order_items ADD CONSTRAINT chk_qty_gt0 CHECK (qty > 0)`
  );

  await knex.raw(
    `ALTER TABLE payments ADD CONSTRAINT chk_payment_amount_gt0 CHECK (amount > 0)`
  );

  await knex.raw(
    `ALTER TABLE products ADD CONSTRAINT chk_price_ge0 CHECK (price >= 0)`
  );
}

export async function down(knex) {
  await knex.raw(`
    ALTER TABLE orders
    MODIFY COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
  `);

  await knex
    .raw(`ALTER TABLE order_items DROP CHECK chk_qty_gt0`)
    .catch(() => {});

  await knex
    .raw(`ALTER TABLE payments DROP CHECK chk_payment_amount_gt0`)
    .catch(() => {});

  await knex
    .raw(`ALTER TABLE products DROP CHECK chk_price_ge0`)
    .catch(() => {});
}
