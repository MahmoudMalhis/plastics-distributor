import db from "../../db/knex.js";
import * as repo from "./payments.repo.js";
import * as custRepo from "../customers/customers.repo.js";
import * as ordersRepo from "../orders/orders.repo.js"; // لديك وحدة الطلبات
import { io } from "../../server.js";

export async function createPayment({
  customer_id,
  order_id,
  amount,
  method, // 'cash' | 'transfer' | 'check'
  note,
  received_at,
  byUserId,
  byUserRole,
  byDistributorId,
}) {
  if (!customer_id || !amount || amount <= 0) {
    const err = new Error("customer_id و amount مطلوبان، وamount > 0");
    err.status = 400;
    throw err;
  }
  // تحقق وجود العميل
  const customer = await custRepo.getById(customer_id);
  if (!customer) {
    const err = new Error("العميل غير موجود");
    err.status = 404;
    throw err;
  }

  // إن أُرسِل order_id تأكّد أنه لنفس العميل
  if (order_id) {
    const order = await ordersRepo.getById(order_id);
    if (!order || order.customer_id !== customer_id) {
      const err = new Error("الطلب غير موجود أو لا يخص العميل");
      err.status = 400;
      throw err;
    }
  }

  if (byUserRole === "distributor") {
    if (!byDistributorId || customer.distributor_id !== byDistributorId) {
      const err = new Error("forbidden: customer not owned by distributor");
      err.status = 403;
      throw err;
    }
    if (order && order.distributor_id !== byDistributorId) {
      const err = new Error("forbidden: order not owned by distributor");
      err.status = 403;
      throw err;
    }
  }

  return await db.transaction(async (trx) => {
    // 1) سجّل الدفعة
    const payment = await repo.insertPayment(trx, {
      customer_id,
      order_id,
      amount,
      method,
      note,
      received_at,
      created_by: byUserId,
    });

    // 2) قيد Ledger (الدائن)
    const entry = await repo.postLedgerCredit(trx, {
      customer_id,
      ref_type: "payment",
      ref_id: payment.id,
      amount,
    });

    // 3) (اختياري) تحديث حالة خطة القسط لو مرتبطة بطلب محدد
    if (order_id) {
      await repo.tryCompleteInstallmentPlanIfSettled(trx, { order_id });
    }

    // 4) بث Socket/WebPush (في الحد الأدنى Socket)
    io.emit("payment:created", {
      customer_id,
      payment_id: payment.id,
      amount,
      method,
      balance_after: entry.balance_after,
      at: entry.created_at,
    });

    return { payment, ledger: entry };
  });
}
