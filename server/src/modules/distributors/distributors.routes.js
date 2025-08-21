import { Router } from "express";
import * as ctrl from "./distributors.controller.js";
import { requireAuth, requireAdmin } from "../../core/auth/rbac.js";
import { validateCreate, validateUpdate } from "./distributors.validators.js";

const router = Router();

// جميع هذه الراوتات خاصة بالإدارة
router.get("/", requireAuth, requireAdmin, ctrl.list);
router.post("/", requireAuth, requireAdmin, validateCreate, ctrl.create);
router.patch("/:id", requireAuth, requireAdmin, validateUpdate, ctrl.update);

// توليد توكن لتعيين كلمة المرور لإرساله عبر الواتساب
router.post(
  "/:id/password-token",
  requireAuth,
  requireAdmin,
  ctrl.issuePasswordToken
);

export default router;
