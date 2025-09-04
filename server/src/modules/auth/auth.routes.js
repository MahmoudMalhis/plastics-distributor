// src/modules/auth/auth.routes.js
import { Router } from "express";
import * as ctrl from "./auth.controller.js";
import {
  loginRateLimiter,
  strictRateLimiter,
  tokenVerifyRateLimiter,
} from "../../middlewares/rate-limit.js";
import { ensureActive, requireAuth } from "../../core/auth/rbac.js";

const router = Router();

router.get("/me", requireAuth, ensureActive, ctrl.me);
router.get("/initialized", ctrl.initialized);
router.post("/bootstrap-token", strictRateLimiter, ctrl.issueBootstrapToken);
router.post("/setup-initial-admin", strictRateLimiter, ctrl.setupInitialAdmin);
router.post("/login", loginRateLimiter, ctrl.login);
router.post("/refresh", ctrl.refresh);
router.get(
  "/password-token/verify",
  tokenVerifyRateLimiter,
  ctrl.verifyPasswordToken
);
router.post("/set-password", strictRateLimiter, ctrl.setPassword);
router.post(
  "/change-password",
  requireAuth,
  ensureActive,
  strictRateLimiter,
  ctrl.changeMyPassword
);

export default router;
