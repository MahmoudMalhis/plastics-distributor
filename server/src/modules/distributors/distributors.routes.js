// server/src/modules/distributors/distributors.routes.js
import { Router } from "express";
import * as ctrl from "./distributors.controller.js";
import {
  requireAuth,
  requireAdmin,
  ensureActive,
} from "../../core/auth/rbac.js";
import { validateCreate, validateUpdate } from "./distributors.validators.js";
import { singleImage } from "../../core/files/multer.js";

const router = Router();

router.get("/", requireAuth, requireAdmin, ctrl.list);
router.post("/", requireAuth, requireAdmin, validateCreate, ctrl.create);
router.post(
  "/:id/password-token",
  requireAuth,
  requireAdmin,
  ctrl.issuePasswordToken
);
router.get("/me/profile", requireAuth, ensureActive, ctrl.getMyProfile);
router.get("/:id", requireAuth, ensureActive, ctrl.getOne);
router.patch("/:id", requireAuth, requireAdmin, validateUpdate, ctrl.update);
router.post(
  "/:id/id-image",
  requireAuth,
  requireAdmin,
  singleImage,
  ctrl.uploadIdImage
);
router.get("/:id", requireAuth, requireAdmin, ctrl.show);
export default router;
