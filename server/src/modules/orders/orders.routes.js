import { Router } from "express";
import * as ctrl from "./orders.controller.js";
import { requireAuth } from "../../core/auth/rbac.js";

const router = Router();

router.post("/", requireAuth, ctrl.create);
router.get("/", requireAuth, ctrl.list);
router.get("/drafts", requireAuth, ctrl.listDrafts);
router.get("/customer/:customerId", requireAuth, ctrl.getCustomerOrders);
router.get("/:id", requireAuth, ctrl.show);
router.patch("/:id", requireAuth, ctrl.update);
router.delete("/:id", requireAuth, ctrl.remove);

export default router;
