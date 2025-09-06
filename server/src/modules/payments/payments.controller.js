import * as svc from "./payments.service.js";

export async function createPayment(req, res, next) {
  try {
    const { customer_id, order_id, amount, method, note, received_at } =
      req.body || {};
    const out = await svc.createPayment({
      customer_id: Number(customer_id),
      order_id: order_id ? Number(order_id) : null,
      amount: Number(amount),
      method: String(method || "cash"),
      note: note ?? null,
      received_at: received_at ? new Date(received_at) : new Date(),
      byUserId: req.user.id,
      byUserRole: req.user.role,
      byDistributorId: req.user.distributorId ?? null,
    });
    res.status(201).json(out);
  } catch (e) {
    next(e);
  }
}
