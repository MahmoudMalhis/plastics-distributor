import { Router } from "express";
import * as ctrl from "./customers.controller.js";
import { requireAuth, ensureActive } from "../../core/auth/rbac.js";

const router = Router();

router.get("/", requireAuth, ctrl.list);
router.post("/", requireAuth, ctrl.create);
router.get("/:id", requireAuth, ctrl.show);
router.patch("/:id", requireAuth, ctrl.update);
router.get("/:id/statement", requireAuth, ensureActive, ctrl.getStatement);
router.get("/:id/timeline", requireAuth, ensureActive, ctrl.timeline);

export default router;
