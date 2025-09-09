// server/src/modules/orders/orders.service.js
import * as repo from "./orders.repo.js";
import db from "../../db/knex.js";
import * as paymentsRepo from "../payments/payments.repo.js";

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
      it.unit_price || prod.price || prod.unit_price || 0
    );
    const snapshot = {
      id: prod.id,
      name: prod.name,
      sku: it.sku ?? prod.sku ?? prod.code ?? null,
      image: prod.image_url ?? prod.image ?? null,
      price: unit_price,
      unit: prod.unit || null,
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

  // تصحيح cheque/check
  const normalizedMethod = method === "cheque" ? "checks" : method;

  if (!["cash", "installments", "checks"].includes(normalizedMethod)) {
    const e = new Error("طريقة الدفع غير مدعومة");
    e.status = 400;
    throw e;
  }

  const res = {
    payment_method: normalizedMethod,
    installment_plan_id: null,
    check_note: null,
  };

  if (normalizedMethod === "installments") {
    const amt = Number(dto.installment_amount || 0);
    const period = String(dto.installment_period || "monthly").toLowerCase();

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
  } else if (normalizedMethod === "checks") {
    res.check_note = String(dto.check_note || dto.cheque_note || "").slice(
      0,
      255
    );
  }

  return res;
}

function calcNextDue(period) {
  const d = new Date();
  if (period === "weekly") d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

function dbNow() {
  return new Date();
}

export async function create(payload, currentUser) {
  const status = String(payload.status || "draft").toLowerCase();
  if (!["draft", "submitted"].includes(status)) {
    const e = new Error("حالة الطلب غير صالحة");
    e.status = 400;
    throw e;
  }

  // التعامل مع distributor_id و distributorId
  let distributor_id;
  if (currentUser?.distributor_id != null) {
    distributor_id = Number(currentUser.distributor_id);
  } else if (currentUser?.distributorId != null) {
    distributor_id = Number(currentUser.distributorId);
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

  const baseOrder = {
    distributor_id,
    created_by,
    customer_id,
    status,
    total: Number(total.toFixed(2)),
    discount_amount: Number(payload.discount_amount || 0),
    discount_percentage: Number(payload.discount_percentage || 0),
    notes: payload.notes || null,
    payment_method: pay.payment_method,
    installment_plan_id: null,
    check_note: pay.check_note,
    submitted_at: status === "submitted" ? dbNow() : null,
    approved_at: null,
    fulfilled_at: null,
    canceled_at: null,
  };

  // إنشاء الطلب
  const order = await repo.createOrder(baseOrder);

  // إضافة العناصر
  if (items.length) {
    await repo.insertItems(items.map((it) => ({ ...it, order_id: order.id })));
  }

  // إضافة قيد دفتر إذا كان هناك عميل
  if (customer_id) {
    try {
      await db.transaction(async (trx) => {
        await paymentsRepo.postLedgerDebit(trx, {
          customer_id,
          ref_type: "order",
          ref_id: order.id,
          amount: total,
        });
      });
    } catch (error) {
      console.error("Error posting ledger debit:", error);
    }
  }

  // إنشاء خطة التقسيط إن وجدت
  if (
    pay.payment_method === "installments" &&
    pay._installment_amount &&
    pay._installment_period
  ) {
    try {
      const plan = await repo.createInstallmentPlan({
        order_id: order.id,
        customer_id,
        amount: pay._installment_amount,
        period: pay._installment_period,
        frequency: pay._installment_period,
        status: "active",
        next_due_date: calcNextDue(pay._installment_period),
        total_amount: total,
        remaining_amount: total,
        total_installments: Math.ceil(total / pay._installment_amount),
        paid_installments: 0,
      });

      if (plan?.id) {
        await repo.updateOrder(order.id, { installment_plan_id: plan.id });
      }
    } catch (error) {
      console.error("Error creating installment plan:", error);
    }
  }

  // معالجة الدفعة الأولى إن وجدت
  const fp = Number(payload.first_payment || 0);
  if (fp > 0 && customer_id) {
    try {
      await db.transaction(async (trx) => {
        const paymentData = {
          customer_id,
          order_id: order.id,
          amount: fp,
          method: pay.payment_method === "checks" ? "check" : "cash",
          note:
            pay.payment_method === "installments"
              ? "دفعة أولى (تقسيط)"
              : pay.payment_method === "checks"
              ? "دفعة أولى (شيك)"
              : "دفعة أولى",
          received_at: new Date(),
          created_by: created_by,
        };

        const payment = await trx("payments").insert(paymentData);
        const paymentId = Array.isArray(payment) ? payment[0] : payment;

        await paymentsRepo.postLedgerCredit(trx, {
          customer_id,
          ref_type: "payment",
          ref_id: paymentId,
          amount: fp,
        });
      });
    } catch (error) {
      console.error("Error processing first payment:", error);
    }
  }

  // إرجاع بيانات الطلب الكاملة
  return repo.getOrderFull(order.id);
}

export async function list(query = {}, currentUser) {
  const opts = {
    search: query.search,
    page: Number(query.page || 1),
    limit: Number(query.limit || 20),
    status: query.status ? String(query.status).toLowerCase() : undefined,
    includeDrafts: Boolean(query.includeDrafts),
  };

  if (currentUser?.role === "distributor") {
    const distId = currentUser?.distributor_id || currentUser?.distributorId;
    if (distId) {
      opts.distributor_id = Number(distId);
    }
  }

  return repo.listOrders(opts);
}

export async function remove(id, currentUser) {
  const order = await repo.getOrderById(Number(id));
  if (!order) {
    const e = new Error("الطلب غير موجود");
    e.status = 404;
    throw e;
  }

  if (currentUser?.role === "distributor") {
    const distId = currentUser?.distributor_id || currentUser?.distributorId;
    if (distId && Number(order.distributor_id) !== Number(distId)) {
      const e = new Error("صلاحيات غير كافية");
      e.status = 403;
      throw e;
    }
  }

  if (String(order.status) !== "draft") {
    const e = new Error("لا يمكن حذف الطلب إلا إذا كان مسودة");
    e.status = 400;
    throw e;
  }

  await repo.deleteOrderCascade(order.id);
  return true;
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

  if (currentUser?.role === "distributor") {
    const distId = currentUser?.distributor_id || currentUser?.distributorId;
    if (distId && Number(order.distributor_id) !== Number(distId)) {
      const e = new Error("صلاحيات غير كافية");
      e.status = 403;
      throw e;
    }
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
    if (!["draft", "submitted", "canceled", "fulfilled"].includes(next)) {
      const e = new Error("حالة الطلب غير صالحة");
      e.status = 400;
      throw e;
    }
    patch.status = next;
    if (next === "submitted" && !order.submitted_at)
      patch.submitted_at = dbNow();
    if (next === "canceled") patch.canceled_at = dbNow();
    if (next === "fulfilled") patch.fulfilled_at = dbNow();
  }

  if (payload.notes !== undefined) patch.notes = payload.notes || null;

  if (payload.payment_method !== undefined) {
    const pay = normalizePayment(payload);
    patch.payment_method = pay.payment_method;
    patch.check_note = pay.check_note;

    if (
      pay.payment_method === "installments" &&
      pay._installment_amount &&
      pay._installment_period
    ) {
      try {
        const plan = await repo.createInstallmentPlan({
          order_id: order.id,
          customer_id: order.customer_id,
          amount: pay._installment_amount,
          period: pay._installment_period,
          frequency: pay._installment_period,
          total_amount: order.total,
          remaining_amount: order.total,
        });
        patch.installment_plan_id = plan?.id ?? null;
      } catch (error) {
        console.error("Error creating installment plan:", error);
      }
    }
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

export async function getCustomerOrders(customerId, query = {}, currentUser) {
  if (!currentUser) {
    const e = new Error("غير مصرح");
    e.status = 401;
    throw e;
  }

  const customer = await db("customers").where({ id: customerId }).first();
  if (!customer) {
    const e = new Error("العميل غير موجود");
    e.status = 404;
    throw e;
  }

  const isAdmin = currentUser.role === "admin";
  const distId = currentUser?.distributor_id || currentUser?.distributorId;
  const isOwnerDistributor =
    currentUser.role === "distributor" &&
    distId &&
    Number(customer.distributor_id) === Number(distId);

  if (!isAdmin && !isOwnerDistributor) {
    const e = new Error("ليس لديك صلاحية عرض طلبات هذا العميل");
    e.status = 403;
    throw e;
  }

  const opts = {
    page: Number(query.page || 1),
    limit: Number(query.limit || 20),
    status: query.status ? String(query.status).toLowerCase() : undefined,
  };

  const result = await repo.listOrdersByCustomer(customerId, opts);

  const enhancedRows = await Promise.all(
    result.rows.map(async (order) => {
      let installmentPlan = null;
      if (order.installment_plan_id) {
        installmentPlan = await db("installment_plans")
          .where({ id: order.installment_plan_id })
          .first();
      }

      const paymentsResult = await db("payments")
        .where({ order_id: order.id })
        .sum({ total_paid: "amount" })
        .first();

      const totalPaid = Number(paymentsResult?.total_paid || 0);
      const remaining = Number(order.total) - totalPaid;

      return {
        ...order,
        installment_plan: installmentPlan,
        total_paid: totalPaid,
        remaining_amount: remaining,
        is_fully_paid: remaining <= 0,
      };
    })
  );

  return {
    customer: {
      id: customer.id,
      name: customer.name,
      customer_sku: customer.customer_sku,
    },
    orders: enhancedRows,
    pagination: {
      page: opts.page,
      limit: opts.limit,
      total: result.total,
      pages: Math.ceil(result.total / opts.limit),
    },
  };
}
