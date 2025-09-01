import * as repo from "./orders.repo.js";

// ----- أدوات -----
function assertItemsValid(items = []) {
  if (!Array.isArray(items) || !items.length) {
    const e = new Error("عناصر الطلب مطلوبة");
    e.status = 400;
    throw e;
  }
  for (const it of items) {
    const q = Number(it.qty);
    if (!Number.isFinite(q) || q <= 0) {
      const e = new Error("الكمية يجب أن تكون أكبر من صفر");
      e.status = 400;
      throw e;
    }
  }
}

async function hydrateItems(items = []) {
  const out = [];
  for (const it of items) {
    const product_id = Number(it.product_id);
    const qty = Number(it.qty);
    const prod = await repo.getProductById(product_id);
    if (!prod) {
      const e = new Error(`المنتج ${product_id} غير موجود`);
      e.status = 400;
      throw e;
    }
    const unit_price = Number(
      prod.price || prod.unit_price || it.unit_price || 0
    );
    const snapshot = {
      id: prod.id,
      name: prod.name,
      sku: prod.sku || prod.code || null,
      price: unit_price,
    };
    out.push({
      product_id,
      qty,
      unit_price,
      product_snapshot: JSON.stringify(snapshot),
    });
  }
  return out;
}

function calcTotal(items = []) {
  return items.reduce((s, it) => s + Number(it.unit_price) * Number(it.qty), 0);
}

function normalizePayment(dto = {}) {
  const method = (dto.payment_method || "cash").toLowerCase();
  if (!["cash", "installments", "cheque"].includes(method)) {
    const e = new Error("طريقة الدفع غير مدعومة");
    e.status = 400;
    throw e;
  }
  const res = {
    payment_method: method,
    installment_plan_id: null,
    check_note: null,
  };

  if (method === "installments") {
    const amt = Number(dto.installment_amount);
    const period = String(dto.installment_period || "").toLowerCase(); // weekly | monthly
    if (!Number.isFinite(amt) || amt <= 0) {
      const e = new Error("قيمة الدفعة غير صالحة");
      e.status = 400;
      throw e;
    }
    if (!["weekly", "monthly"].includes(period)) {
      const e = new Error("دورية الدفعات غير صالحة (weekly/monthly)");
      e.status = 400;
      throw e;
    }
    res._installment_amount = amt;
    res._installment_period = period;
  } else if (method === "cheque") {
    res.check_note = (dto.check_note || dto.cheque_note || "").slice(0, 255);
  }

  return res;
}

// ----- إنشاء -----
export async function create(payload, currentUser) {
  console.log("=== ORDER CREATION DEBUG ===");
  console.log("payload:", payload);
  console.log("currentUser:", currentUser);
  console.log("payload.distributor_id:", payload.distributor_id); // تصحيح الخطأ
  console.log("currentUser.distributor_id:", currentUser?.distributor_id);
  console.log("=== ORDER CREATION DEBUG ===");

  const status = String(payload.status || "draft").toLowerCase();
  if (!["draft", "submitted"].includes(status)) {
    const e = new Error("حالة الطلب غير صالحة");
    e.status = 400;
    throw e;
  }
  let distributor_id;
  if (currentUser?.distributor_id != null) {
    distributor_id = Number(currentUser.distributor_id);
  } else if (payload.distributor_id != null) {
    distributor_id = Number(payload.distributor_id);
  } else {
    const e = new Error("معرف الموزع مطلوب");
    e.status = 400;
    throw e;
  }

  const created_by = currentUser?.id || null;

  const customer_id =
    payload.customer_id != null ? Number(payload.customer_id) : null;

  const itemsDto = Array.isArray(payload.items) ? payload.items : [];
  if (status === "submitted") assertItemsValid(itemsDto);

  const items = await hydrateItems(itemsDto);
  const total = calcTotal(items);

  const pay = normalizePayment(payload);

  if (
    pay.payment_method === "installments" &&
    pay._installment_amount &&
    pay._installment_period
  ) {
    try {
      const plan = await repo.createInstallmentPlan({
        amount: pay._installment_amount,
        period: pay._installment_period,
      });
      pay.installment_plan_id = plan?.id ?? null;
    } catch {
      pay.installment_plan_id = null;
    }
  }

  const baseOrder = {
    distributor_id: distributor_id,
    created_by,
    customer_id,
    status,
    total: Number(total.toFixed(2)),
    notes: payload.notes || null,
    payment_method: pay.payment_method,
    installment_plan_id: pay.installment_plan_id ?? null,
    check_note: pay.check_note ?? null,
    submitted_at: status === "submitted" ? dbNow() : null,
    approved_at: null,
    fulfilled_at: null,
    canceled_at: null,
  };

  const order = await repo.createOrder(baseOrder);

  if (items.length) {
    await repo.insertItems(items.map((it) => ({ ...it, order_id: order.id })));
  }

  return repo.getOrderFull(order.id);
}

export async function list(query = {}, currentUser) {
  const opts = {
    search: query.search,
    page: Number(query.page || 1),
    limit: Number(query.limit || 20),
  };
  if (currentUser?.role === "distributor" && currentUser?.distributor_id) {
    opts.distributor_id = Number(currentUser.distributor_id);
  }
  return repo.listOrders(opts);
}

export async function show(id) {
  const data = await repo.getOrderFull(Number(id));
  if (!data) {
    const e = new Error("الطلب غير موجود");
    e.status = 404;
    throw e;
  }
  return data;
}

export async function update(id, payload, currentUser) {
  const order = await repo.getOrderById(Number(id));
  if (!order) {
    const e = new Error("الطلب غير موجود");
    e.status = 404;
    throw e;
  }

  if (
    currentUser?.role === "distributor" &&
    currentUser?.distributor_id &&
    Number(order.distributor_id) !== Number(currentUser.distributor_id)
  ) {
    const e = new Error("صلاحيات غير كافية");
    e.status = 403;
    throw e;
  }

  const isSubmitted = String(order.status) === "submitted";
  if (isSubmitted) {
    const reason = (payload.reason || "").trim();
    if (!reason) {
      const e = new Error("سبب التعديل مطلوب لهذا الطلب");
      e.status = 400;
      throw e;
    }
  }

  const patch = {};
  if (payload.status) {
    const next = String(payload.status).toLowerCase();
    if (!["draft", "submitted", "cancelled", "fulfilled"].includes(next)) {
      const e = new Error("حالة الطلب غير صالحة");
      e.status = 400;
      throw e;
    }
    patch.status = next;
    if (next === "submitted" && !order.submitted_at)
      patch.submitted_at = dbNow();
    if (next === "cancelled") patch.canceled_at = dbNow();
    if (next === "fulfilled") patch.fulfilled_at = dbNow();
  }

  if (payload.notes !== undefined) patch.notes = payload.notes || null;

  if (
    payload.payment_method !== undefined ||
    payload.installment_amount !== undefined ||
    payload.installment_period !== undefined ||
    payload.check_note !== undefined ||
    payload.cheque_note !== undefined
  ) {
    const pay = normalizePayment(payload);
    if (
      pay.payment_method === "installments" &&
      pay._installment_amount &&
      pay._installment_period
    ) {
      try {
        const plan = await repo.createInstallmentPlan({
          amount: pay._installment_amount,
          period: pay._installment_period,
        });
        patch.installment_plan_id = plan?.id ?? null;
      } catch {}
    } else {
      patch.installment_plan_id = pay.installment_plan_id ?? null;
    }
    patch.payment_method = pay.payment_method;
    patch.check_note = pay.check_note ?? null;
  }

  let newItems = null;
  if (Array.isArray(payload.items)) {
    if (isSubmitted || patch.status === "submitted") {
      assertItemsValid(payload.items);
    }
    newItems = await hydrateItems(payload.items);
    patch.total = Number(calcTotal(newItems).toFixed(2));
  }

  if (isSubmitted) {
    const before = await repo.getOrderFull(order.id);
    await repo.updateOrder(order.id, patch);
    if (newItems) {
      await repo.deleteItemsByOrder(order.id);
      await repo.insertItems(
        newItems.map((it) => ({ ...it, order_id: order.id }))
      );
    }
    const after = await repo.getOrderFull(order.id);
    await repo.insertRevision({
      order_id: order.id,
      editor_user_id: currentUser?.id || null,
      reason: payload.reason,
      change_set: { before, after },
    });
  } else {
    await repo.updateOrder(order.id, patch);
    if (newItems) {
      await repo.deleteItemsByOrder(order.id);
      await repo.insertItems(
        newItems.map((it) => ({ ...it, order_id: order.id }))
      );
    }
  }

  return repo.getOrderFull(order.id);
}

function dbNow() {
  return new Date().toISOString();
}
