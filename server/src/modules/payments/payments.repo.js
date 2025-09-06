import db from "../../db/knex.js";

// ===== Payments =====
export async function insertPayment(
  trx,
  { customer_id, order_id, amount, method, note, received_at, created_by }
) {
  const [id] = await trx("payments").insert({
    customer_id,
    order_id,
    amount,
    method,
    note,
    received_at,
    created_by,
  });
  const insertedId = typeof id === "object" ? id?.insertId : id;
  return trx("payments").where({ id: insertedId }).first();
}

// ===== Ledger helpers =====
async function getLastBalance(trx, customer_id) {
  const row = await trx("ledger_entries")
    .where({ customer_id })
    .orderBy("id", "desc")
    .first()
    .forUpdate(); // قفل للسلامة في التنافس
  return Number(row?.balance_after || 0);
}

export async function postLedgerCredit(
  trx,
  { customer_id, ref_type, ref_id, amount }
) {
  const last = await getLastBalance(trx, customer_id);
  const balance_after = last - Number(amount);
  const [id] = await trx("ledger_entries").insert({
    customer_id,
    ref_type, // 'payment'
    ref_id,
    debit: 0,
    credit: amount,
    balance_after,
    created_at: trx.fn.now(),
  });
  const insertedId = typeof id === "object" ? id?.insertId : id;
  return trx("ledger_entries").where({ id: insertedId }).first();
}

// يُستخدم من orders عند تسجيل فاتورة (مدين)
export async function postLedgerDebit(
  trx,
  { customer_id, ref_type, ref_id, amount }
) {
  const last = await getLastBalance(trx, customer_id);
  const balance_after = last + Number(amount);
  const [id] = await trx("ledger_entries").insert({
    customer_id,
    ref_type, // 'order'
    ref_id,
    debit: amount,
    credit: 0,
    balance_after,
    created_at: trx.fn.now(),
  });
  const insertedId = typeof id === "object" ? id?.insertId : id;
  return trx("ledger_entries").where({ id: insertedId }).first();
}

// ===== Installments completion check =====
export async function tryCompleteInstallmentPlanIfSettled(trx, { order_id }) {
  // إن وُجدت خطة قسط مرتبطة بالطلب، افحص صافي الدين للطلب
  const plan = await trx("installment_plans").where({ order_id }).first();
  if (!plan) return null;

  // إجمالي الطلب من ledger مقابل دفعاته
  const totals = await trx("ledger_entries")
    .where({ ref_type: "order", ref_id: order_id })
    .sum({ deb: "debit" })
    .first();
  const deb = Number(totals?.deb || 0);

  const pays = await trx("payments")
    .where({ order_id })
    .sum({ paid: "amount" })
    .first();
  const paid = Number(pays?.paid || 0);

  if (paid >= deb) {
    await trx("installment_plans")
      .where({ id: plan.id })
      .update({ status: "completed", next_due_date: null });
    return "completed";
  }
  return "active";
}
