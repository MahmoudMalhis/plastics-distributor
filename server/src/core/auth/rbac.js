// src/core/auth/rbac.js
import { verifyAccess } from "./jwt.js";
import db from "../../db/knex.js";

/**
 * يتحقق من وجود Bearer token وصحته
 * عند النجاح يملأ req.user بالقيم (id, role, distributorId? ...)
 * 401 = لا يوجد توكن/توكن غير صالح
 */
export function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const isBearer = header.toLowerCase().startsWith("bearer ");
    const token = isBearer ? header.slice(7).trim() : null;

    if (!token) return res.status(401).json({ error: "no token" });

    const payload = verifyAccess(token); // مثال: { id, role, distributorId, active }
    req.user = payload;
    return next();
  } catch (e) {
    return res.status(401).json({ error: "invalid token" });
  }
}

/**
 * تقييد بالأدوار
 * 403 = عند توكن صالح لكن الدور غير مخوّل
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "unauthorized" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "forbidden" });
    }
    next();
  };
}

export const requireAdmin = requireRole("admin");
export const requireDistributor = requireRole("distributor");

/**
 * تأكد أن الحساب/المورّد فعّال (عند الحاجة)
 * - لو المستخدم مربوط بمورّد (Distributor) وكان معطل → 403
 */
export async function ensureActive(req, res, next) {
  try {
    if (!req.user) return res.status(401).json({ error: "unauthorized" });

    // تحقق من تعطيل المستخدم نفسه إن كنت تحفظ "active" داخل الـ JWT
    if (req.user.active === false || req.user.active === 0) {
      return res.status(403).json({ error: "user disabled" });
    }

    // لو المستخدم distributor ومرتبط بـ distributor
    if (req.user.role === "distributor" && req.user.distributorId) {
      const distributor = await db("distributors")
        .where({ id: req.user.distributorId })
        .first();

      if (
        !distributor ||
        distributor.active === 0 ||
        distributor.active === false
      ) {
        return res.status(403).json({ error: "distributor disabled" });
      }
    }

    return next();
  } catch (e) {
    return next(e);
  }
}
