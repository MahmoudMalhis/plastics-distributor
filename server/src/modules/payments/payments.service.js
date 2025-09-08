// server/src/modules/payments/payments.service.js - النسخة المحدثة
import db from "../../db/knex.js";
import * as paymentsRepo from "./payments.repo.js";
import * as customersRepo from "../customers/customers.repo.js";

function canReceiveForCustomer(user, customer) {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (
    user.role === "distributor" &&
    customer?.distributor_id === (user?.distributor_id ?? user?.distributorId)
  )
    return true;
  return false;
}

export async function createPayment({
  customer_id,
  order_id,
  amount,
  method,
  reference,
  note,
  received_at,
  byUserId,
  byUserRole,
  byDistributorId,
}) {
  const user = {
    id: byUserId,
    role: byUserRole,
    distributor_id: byDistributorId,
  };
  return createForCustomer(
    customer_id,
    { amount, method, reference, note, received_at, order_id },
    user
  );
}

export async function createForCustomer(customerId, payload, user) {
  const customer = await customersRepo.getCustomerBasic(customerId);
  if (!customer) {
    const e = new Error("customer not found");
    e.status = 404;
    throw e;
  }
  if (!canReceiveForCustomer(user, customer)) {
    const e = new Error("forbidden");
    e.status = 403;
    throw e;
  }

  const amount = Number(payload?.amount || 0);
  if (!(amount > 0)) {
    const e = new Error("amount must be > 0");
    e.status = 400;
    throw e;
  }

  const payment = await paymentsRepo.insertPayment({
    customer_id: customerId,
    order_id: payload?.order_id || null,
    amount,
    method: payload?.method || "cash",
    reference: payload?.reference || null,
    note: payload?.note || null,
    received_at: payload?.received_at
      ? new Date(payload.received_at)
      : new Date(),
    created_by_user_id: user?.id || null,
    distributor_id:
      user?.role === "distributor"
        ? user?.distributor_id ?? user?.distributorId ?? null
        : null,
  });

  // 2) قيد دائن في الدفتر
  try {
    await paymentsRepo.postLedgerCredit(db, {
      customer_id: customerId,
      ref_type: "payment",
      ref_id: payment.id,
      amount,
    });
  } catch (error) {
    console.log(error);
  }

  // 3) تحديث خطة التقسيط (إن وُجدت) — تجاهُل آمن لو الأعمدة غير موجودة
  if (payload?.order_id) {
    try {
      const plan = await db("installment_plans")
        .where({ order_id: payload.order_id })
        .first();
      if (plan) {
        const freq = plan.frequency || plan.period || "monthly";
        const next = calculateNextDueDate(freq);
        const updates = {};
        if ("remaining_amount" in plan)
          updates.remaining_amount = Math.max(
            0,
            Number(plan.remaining_amount || 0) - amount
          );
        if ("paid_installments" in plan)
          updates.paid_installments = Number(plan.paid_installments || 0) + 1;
        if ("next_due_date" in plan) updates.next_due_date = next;
        if ("status" in plan && "remaining_amount" in updates) {
          if (updates.remaining_amount <= 0) {
            updates.status = "completed";
            if ("next_due_date" in plan) updates.next_due_date = null;
          }
        }
        if (Object.keys(updates).length > 0) {
          await db("installment_plans").where({ id: plan.id }).update(updates);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  return { payment };
}

function calculateNextDueDate(frequency) {
  const now = new Date();
  if (frequency === "weekly") {
    now.setDate(now.getDate() + 7);
  } else if (frequency === "monthly") {
    now.setMonth(now.getMonth() + 1);
  }
  return now;
}
