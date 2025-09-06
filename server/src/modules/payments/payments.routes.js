import { Router } from "express";
import * as ctrl from "./payments.controller.js";
import { requireAuth, ensureActive } from "../../core/auth/rbac.js";
import { strictRateLimiter } from "../../middlewares/rate-limit.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  ensureActive,
  strictRateLimiter,
  ctrl.createPayment
);

export default router;
