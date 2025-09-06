// src/modules/auth/auth.controller.js
import * as svc from "./auth.service.js";
import bcrypt from "bcrypt";
import * as repo from "./auth.repo.js";
import * as distRepo from "../distributors/distributors.repo.js";

/* === إعدادات كوكي الريفرِش (كما هي) === */
const COOKIE_NAME = "rt";
const isProd = (process.env.NODE_ENV || "development") === "production";
const refreshCookieBase = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax",
  path: "/api/auth",
};
const btCookieBase = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax",
  path: "/api/auth",
};
export async function login(req, res) {
  try {
    const { username, password } = req.body || {};
    const result = await svc.login(username, password);

    // خزّن refreshToken في كوكي فقط (لا نُرجِعه في JSON)
    if (result?.refreshToken) {
      const oneYearMs = 1000 * 60 * 60 * 24 * 365;
      res.cookie(COOKIE_NAME, result.refreshToken, {
        ...refreshCookieBase,
        maxAge: oneYearMs,
      });
    }

    // 🚫 لا ترجع refreshToken
    const { refreshToken, ...rest } = result || {};
    res.json(rest);
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
    // نقرأ من الكوكي أولاً، ونقبل body للتوافقية
    const fromBody = req.body?.refreshToken;
    const fromCookie = req.cookies?.[COOKIE_NAME];
    const incomingRefresh = fromBody || fromCookie;

    const result = await svc.refresh(incomingRefresh);

    // دوّر الكوكي إذا رجعت خدمة الريفريش توكن جديد
    if (result?.refreshToken) {
      const oneYearMs = 1000 * 60 * 60 * 24 * 365;
      res.cookie(COOKIE_NAME, result.refreshToken, {
        ...refreshCookieBase,
        maxAge: oneYearMs,
      });
    }

    // 🚫 لا ترجع refreshToken
    const { refreshToken, ...rest } = result || {};
    res.json(rest);
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

    res.json({
      user: {
        ...safeUser,
        role: req.user.role,
        active: req.user.active,
        distributorId: req.user.distributorId,
        distributor,
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function issueBootstrapToken(req, res, next) {
  try {
    const { raw, exp } = await svc.issueBootstrapToken(req);
    // نحفظ التوكن الخام في كوكي HttpOnly
    const ttlMs = new Date(exp).getTime() - Date.now();
    res.cookie("bt", raw, { ...btCookieBase, maxAge: ttlMs });
    // نعيد فقط تاريخ الانتهاء (لا نعيد التوكن في الـJSON)
    return res.status(201).json({ expiresAt: exp.toISOString() });
  } catch (e) {
    return next(e);
  }
}

export async function setupInitialAdmin(req, res, next) {
  try {
    const { username, password } = req.body || {};
    const result = await svc.setupInitialAdminViaToken(req, {
      username,
      password,
    });

    // نضع الـrefresh cookie كما في login
    if (result?.refreshToken) {
      const oneYearMs = 1000 * 60 * 60 * 24 * 365;
      res.cookie(COOKIE_NAME, result.refreshToken, {
        ...refreshCookieBase,
        maxAge: oneYearMs,
      });
    }

    const { refreshToken, ...rest } = result || {};
    // إزالة كوكي bt بعد النجاح
    res.clearCookie("bt", { ...btCookieBase });
    return res.status(201).json(rest);
  } catch (e) {
    return next(e);
  }
}
