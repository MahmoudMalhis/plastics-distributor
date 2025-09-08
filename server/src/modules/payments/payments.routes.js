// server/src/modules/payments/payments.routes.js - النسخة المحدثة
import { Router } from "express";
import * as ctrl from "./payments.controller.js";
import { requireAuth, ensureActive } from "../../core/auth/rbac.js";
import { strictRateLimiter } from "../../middlewares/rate-limit.js";

const router = Router();

// دفعة لعميل محدد
router.post(
  "/customers/:id/payments",
  requireAuth,
  ensureActive,
  strictRateLimiter,
  ctrl.createForCustomer
);

// دفعة لطلب محدد
router.post(
  "/orders/:orderId/payments",
  requireAuth,
  ensureActive,
  strictRateLimiter,
  async (req, res, next) => {
    try {
      const orderId = Number(req.params.orderId);
      const { amount, method, reference, note, received_at } = req.body || {};

      // جلب معلومات الطلب
      const order = await db("orders").where({ id: orderId }).first();

      if (!order) {
        return res.status(404).json({ error: "الطلب غير موجود" });
      }

      if (!order.customer_id) {
        return res.status(400).json({ error: "الطلب غير مرتبط بعميل" });
      }

      // إنشاء الدفعة
      const out = await svc.createForCustomer(
        order.customer_id,
        { amount, method, reference, note, received_at, order_id: orderId },
        req.user
      );

      res.status(201).json(out);
    } catch (e) {
      next(e);
    }
  }
);

export default router;
