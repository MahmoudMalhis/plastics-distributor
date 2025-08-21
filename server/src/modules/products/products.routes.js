import { Router } from "express";
import * as ctrl from "./products.controller.js";
import { requireAuth, requireAdmin } from "../../core/auth/rbac.js";
import { singleImage } from "../../core/files/multer.js";

const r = Router();
r.get("/", requireAuth, ctrl.list);
r.post("/", requireAuth, requireAdmin, ctrl.create);
r.patch("/:id", requireAuth, requireAdmin, ctrl.update);
r.post("/:id/archive", requireAuth, requireAdmin, ctrl.archive);
r.post("/:id/restore", requireAuth, requireAdmin, ctrl.restore);
r.post("/:id/image", requireAuth, requireAdmin, singleImage, ctrl.uploadImage);

export default r;
