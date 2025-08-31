import { Router } from "express";
import * as ctrl from "./orders.controller.js";
import { requireAuth } from "../../core/auth/rbac.js";

const router = Router();

// إنشاء طلب (مسودة أو إرسال)
router.post("/orders", requireAuth, ctrl.create);

// “طلباتي” أو جميع الطلبات (حسب الدور) + بحث/صفحات
router.get("/orders", requireAuth, ctrl.list);

// تفاصيل طلب
router.get("/orders/:id", requireAuth, ctrl.show);

// تعديل طلب (يحتاج reason إذا كان Submitted)
router.patch("/orders/:id", requireAuth, ctrl.update);

export default router;
