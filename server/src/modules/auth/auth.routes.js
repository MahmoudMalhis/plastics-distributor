// src/modules/auth/auth.routes.js
import { Router } from "express";
import * as ctrl from "./auth.controller.js";
import {
  loginRateLimiter,
  strictRateLimiter,
  tokenVerifyRateLimiter,
} from "../../middlewares/rate-limit.js"; // إن عندك واحد عام، أو احذف السطر

const router = Router();

router.post("/login", loginRateLimiter, ctrl.login);
router.post("/refresh", ctrl.refresh);
router.get(
  "/password-token/verify",
  tokenVerifyRateLimiter,
  ctrl.verifyPasswordToken
);
router.post("/set-password", strictRateLimiter, ctrl.setPassword);

export default router;
