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

  const dto = {
    customer_id: customerId,
    order_id: payload?.order_id || null,
    amount,
    method: payload?.method || "cash",
    reference: payload?.reference || null,
    note: payload?.note || null,
    received_at: payload?.received_at
      ? new Date(payload.received_at)
      : new Date(),
    created_by: user?.id || null,
  };

  const payment = await db.transaction(async (trx) => {
    // إنشاء الدفعة
    const [paymentId] = await trx("payments").insert(dto);
    const p = await trx("payments").where({ id: paymentId }).first();

    // تسجيل في دفتر الحسابات
    await paymentsRepo.postLedgerCredit(trx, {
      customer_id: customerId,
      ref_type: "payment",
      ref_id: paymentId,
      amount,
    });

    // إذا كانت الدفعة مرتبطة بطلب له خطة تقسيط، حدث الخطة
    if (payload?.order_id) {
      const plan = await trx("installment_plans")
        .where({ order_id: payload.order_id })
        .first();

      if (plan) {
        // حدث المبلغ المتبقي وعدد الأقساط المدفوعة
        const newRemaining = Math.max(
          0,
          Number(plan.remaining_amount) - amount
        );
        const paidInstallments = Number(plan.paid_installments) + 1;

        const updates = {
          remaining_amount: newRemaining,
          paid_installments: paidInstallments,
        };

        // إذا تم سداد كامل المبلغ، أكمل الخطة
        if (newRemaining <= 0) {
          updates.status = "completed";
          updates.next_due_date = null;
        } else {
          // حدث تاريخ الاستحقاق التالي
          updates.next_due_date = calculateNextDueDate(plan.frequency);
        }

        await trx("installment_plans").where({ id: plan.id }).update(updates);
      }
    }

    return p;
  });

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
