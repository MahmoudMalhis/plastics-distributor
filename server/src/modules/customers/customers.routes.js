import { Router } from "express";
import * as ctrl from "./customers.controller.js";
import { requireAuth, requireAdmin } from "../../core/auth/rbac.js";

const router = Router();

router.get("/", requireAuth, ctrl.list);
router.post("/", requireAuth, ctrl.create);
router.get("/:id", requireAuth, ctrl.show);
router.patch("/:id", requireAuth, ctrl.update);

export default router;
