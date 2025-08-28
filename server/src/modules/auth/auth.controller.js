// src/modules/auth/auth.controller.js
import * as svc from "./auth.service.js";
import bcrypt from "bcrypt";
import * as repo from "./auth.repo.js";
import * as distRepo from "../distributors/distributors.repo.js";

export async function login(req, res) {
  try {
    const { username, password } = req.body || {};
    const result = await svc.login(username, password);
    res.json(result);
  } catch (e) {
    res.status(e?.status || 500).json({ error: e?.message || "Server error" });
  }
}

export async function initialized(req, res, next) {
  try {
    const data = await svc.checkInitialized();
    res.json(data);
  } catch (e) {
    next(e);
  }
}

export async function refresh(req, res) {
  try {
    const { refreshToken } = req.body || {};
    const result = await svc.refresh(refreshToken);
    res.json(result);
  } catch (e) {
    res.status(e?.status || 401).json({ error: e?.message || "invalid token" });
  }
}

export async function verifyPasswordToken(req, res, next) {
  try {
    const token = String(req.query.token || "").trim();
    if (!token) return res.status(400).json({ error: "token مطلوب" });

    const out = await svc.verifyPasswordToken(token);
    res.json(out);
  } catch (e) {
    next(e);
  }
}

export async function setPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) {
      return res.status(400).json({ error: "token و newPassword مطلوبة" });
    }
    await svc.setPasswordWithToken({ token, newPassword });
    res.json({ ok: true, message: "تم تعيين كلمة المرور بنجاح" });
  } catch (e) {
    next(e);
  }
}

export async function changeMyPassword(req, res, next) {
  try {
    const authenticatedUserId = req.user?.id;
    const { currentPassword, newPassword } = req.body || {};

    if (!authenticatedUserId) {
      return res.status(401).json({ error: "غير مصرح" });
    }
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "currentPassword و newPassword مطلوبة" });
    }

    const userRecord = await repo.findById(authenticatedUserId);
    if (!userRecord) {
      return res.status(404).json({ error: "المستخدم غير موجود" });
    }

    const isCurrentOk = await bcrypt.compare(
      currentPassword,
      userRecord.password_hash || ""
    );
    if (!isCurrentOk) {
      return res.status(401).json({ error: "كلمة المرور الحالية غير صحيحة" });
    }

    const newHash = await bcrypt.hash(String(newPassword), 10);
    await repo.updateUserPasswordAndFlags(authenticatedUserId, {
      password_hash: newHash,
      must_change_password: false,
    });

    // أمان: إلغاء كل refresh tokens لإجبار إعادة تسجيل الدخول من الجلسات الأخرى
    await repo.revokeRefreshTokensForUser(authenticatedUserId);

    res.json({ ok: true, message: "تم تغيير كلمة المرور بنجاح" });
  } catch (e) {
    next(e);
  }
}

export async function me(req, res, next) {
  try {
    if (!req.user) return res.status(401).json({ error: "unauthorized" });

    const dbUser = await repo.findById(req.user.id);
    if (!dbUser) return res.status(404).json({ error: "not found" });

    const { password_hash, ...safeUser } = dbUser;

    let distributor = null;
    if (dbUser.distributor_id) {
      distributor = await distRepo.getDistributorById(dbUser.distributor_id);
    }

    // ممكن دمج معلومات JWT مع معلومات قاعدة البيانات
    res.json({
      user: {
        ...safeUser,
        role: req.user.role, // من الـ JWT
        active: req.user.active, // من الـ JWT
        distributorId: req.user.distributorId,
        distributor, // كائن الموزّع (اختياري)
      },
    });
  } catch (e) {
    next(e);
  }
}
