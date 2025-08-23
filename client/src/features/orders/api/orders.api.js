// client/src/features/orders/api/orders.api.js
import { api } from "../../../lib/api";

/** إنشاء طلب جديد */
export async function createOrder({ items, notes } = {}) {
  // تحويل عناصر السلة إلى شكل يتوقعه الخادم
  // product_id + quantity (+ price إن كان مطلوبًا)
  const payload = {
    items: (items || []).map((it) => ({
      product_id: it.productId,
      quantity: it.qty,
      price: it.price, // احذف هذا السطر إذا كان السيرفر لا يستقبل السعر من العميل
    })),
    notes,
  };
  const { data } = await api.post("/api/orders", payload);
  return data; // نتوقع { id, ... }
}

/** قائمة طلباتي */
export async function listMyOrders({
  page = 1,
  pageSize = 10,
  q,
  status,
} = {}) {
  const params = {
    mine: true,
    page,
    pageSize,
    q,
    status,
  };
  Object.keys(params).forEach(
    (k) => params[k] === undefined && delete params[k]
  );

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
  return data; // نتوقع { id, status, total, items: [...] , created_at, ... }
}
