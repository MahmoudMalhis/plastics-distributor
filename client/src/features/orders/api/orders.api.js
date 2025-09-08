// client/src/features/orders/api/orders.api.js
import { api } from "../../../lib/api";

/** إنشاء طلب جديد */
export async function createOrder({
  items,
  notes,
  customer_id,
  status = "submitted",
  payment_method = "cash",
  installment_amount,
  installment_period,
  check_note,
} = {}) {
  const payload = {
    customer_id,
    status,
    payment_method,
    installment_amount,
    installment_period,
    check_note,
    items: (items || []).map((it) => ({
      product_id: it.productId,
      qty: it.qty,
    })),
    notes,
  };
  const { data } = await api.post("/api/orders", payload);
  return data;
}

/** قائمة طلباتي */
export async function listMyOrders({
  page = 1,
  pageSize = 10,
  q,
  status,
} = {}) {
  const params = {
    page,
    limit: pageSize,
    search: q,
    status, // إن أردت لاحقًا تدعيم فلترة الحالة في السيرفر
  };
  Object.keys(params).forEach((k) => params[k] == null && delete params[k]);
  const { data } = await api.get("/api/orders", { params });
  if (Array.isArray(data)) return { rows: data, total: data.length };
  return {
    rows: data?.rows || data?.items || [],
    total: Number(data?.total ?? data?.count ?? 0),
  };
}

/** تفاصيل طلب */
export async function getOrder(orderId) {
  const { data } = await api.get(`/api/orders/${orderId}`);
  // السيرفر يرجّع { order, items, revisions, customer }
  if (!data?.order) return data;
  const o = data.order;
  const items = (data.items || []).map((it) => {
    // product_snapshot فيه name/sku/price المحتسبة وقت الطلب
    let snap = {};
    try {
      snap = it.product_snapshot ? JSON.parse(it.product_snapshot) : {};
    } catch (error) {
      console.log(error);
    }
    return {
      product_id: it.product_id,
      product_name: it.product_name || snap.name || "",
      sku: snap.sku || null,
      unit_price: Number(it.unit_price ?? snap.price ?? 0),
      qty: Number(it.qty ?? it.quantity ?? 0),
      image: snap.image || null, // لو بتخزنها مستقبلًا
    };
  });
  return {
    id: o.id,
    code: o.code,
    status: o.status,
    total: Number(o.total || 0),
    created_at: o.created_at,
    notes: o.notes || null,
    payment_method: o.payment_method,
    installment_plan_id: o.installment_plan_id,
    check_note: o.check_note,
    customer: data.customer || null,
    items,
    revisions: data.revisions || [],
    raw: data, // لو احتجته مستقبلًا
  };
}

// تحديث حالة طلب
export async function updateOrderStatus(orderId, nextStatus, reason = "") {
  // السيرفر عندك يطلب reason لأي تعديل على طلب Submitted
  // نمرر سبب افتراضي إن لم يُعطَ سبب
  const payload = { status: nextStatus };
  if (!reason) {
    payload.reason = `Status change to "${nextStatus}" from list`;
  } else {
    payload.reason = reason;
  }
  const { data } = await api.patch(`/api/orders/${orderId}`, payload);
  return data;
}

export async function listDraftOrders({ page = 1, pageSize = 20 } = {}) {
  const { data } = await api.get("/api/orders/drafts", {
    params: { page, limit: pageSize },
  });
  return Array.isArray(data)
    ? { rows: data, total: data.length }
    : { rows: data.items || data.rows || [], total: Number(data.total || 0) };
}

export async function deleteOrder(id) {
  const { data } = await api.delete(`/api/orders/${id}`);
  return data;
}

export async function listOrdersByCustomer(
  customerId,
  { page = 1, limit = 20, status } = {}
) {
  const cid = Number(customerId);
  if (!Number.isFinite(cid) || cid <= 0) throw new Error("Invalid customerId");

  const params = { page, limit };
  if (status) params.status = status;

  const { data } = await api.get(`/api/orders/customer/${cid}`, { params });
  // السيرفر يرجّع { customer, orders, pagination }
  return data;
}
