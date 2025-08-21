// src/modules/categories/categories.routes.js
import { Router } from "express";
import * as ctrl from "./categories.controller.js";
import { requireAuth, requireAdmin } from "../../core/auth/rbac.js";

const router = Router();

// القراءة (تحتاج توكن صالح)
router.get("/", requireAuth, ctrl.list);

// إنشاء/تعديل/حذف: لازم نمرر requireAuth ثم requireAdmin
router.post("/", requireAuth, requireAdmin, ctrl.create);
router.patch("/:id", requireAuth, requireAdmin, ctrl.update);
router.delete("/:id", requireAuth, requireAdmin, ctrl.remove);

export default router;
