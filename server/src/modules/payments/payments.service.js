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
    amount,
    method: payload?.method || null,
    reference: payload?.reference || null,
    note: payload?.note || null,
    received_at: payload?.received_at || null,
    created_by_user_id: user?.id || null,
    distributor_id: user?.role === "distributor" ? (user.distributor_id ?? user.distributorId ?? null) : null,
  };

  const payment = await db.transaction(async (trx) => {
    const p = await paymentsRepo.insertPayment(dto, trx);
    await paymentsRepo.insertLedgerForPayment(p, trx);
    return p;
  });

  return { payment };
}
