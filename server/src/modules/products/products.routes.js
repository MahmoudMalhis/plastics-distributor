import { Router } from "express";
import * as ctrl from "./products.controller.js";
import {
  requireAuth,
  requireAdmin,
  ensureActive,
} from "../../core/auth/rbac.js";
import * as svc from "./products.service.js";
import { singleImage } from "../../core/files/multer.js";

const router = Router();
router.get("/", requireAuth, ctrl.list);
router.post("/", requireAuth, requireAdmin, ctrl.create);
router.patch("/:id", requireAuth, requireAdmin, ctrl.update);
router.post("/:id/archive", requireAuth, requireAdmin, ctrl.archive);
router.post("/:id/restore", requireAuth, requireAdmin, ctrl.restore);
router.post(
  "/:id/image",
  requireAuth,
  requireAdmin,
  singleImage,
  ctrl.uploadImage
);
router.get("/:id", requireAuth, ensureActive, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "invalid id" });

    const row = await svc.getById(id, { user: req.user });
    if (!row) return res.status(404).json({ error: "not found" });

    res.json(row);
  } catch (e) {
    next(e);
  }
});
export default router;
