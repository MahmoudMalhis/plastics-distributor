import * as repo from "./auth.repo.js";
import bcrypt from "bcrypt";
import { signAccess, signRefresh, verifyRefresh } from "../../core/auth/jwt.js";
import { hasAnyUser } from "./auth.repo.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";

/**
 * تسجيل الدخول: يولد access token و refresh token،
 * ويخزن تجزئة refresh token مع تاريخ انتهائه في قاعدة البيانات.
 */
export async function login(username, password) {
  username = String(username || "").trim();
  password = String(password || "");

  if (!username || !password) {
    const err = new Error("username/password required");
    err.status = 400;
    throw err;
  }

  // BOOTSTRAP: عند انعدام المستخدمين، يُنشأ حساب admin تلقائيًا
  const total = await repo.countUsers();
  if (total === 0) {
    const password_hash = await bcrypt.hash(password, 10);
    const admin = await repo.createUser({
      username,
      password_hash,
      role: "admin",
      active: true,
      must_change_password: true,
    });
    const accessToken = signAccess(admin);
    const refreshToken = signRefresh(admin);

    // تخزين refresh token في قاعدة البيانات
    try {
      const decoded = jwt.decode(refreshToken);
      const expMs = decoded?.exp
        ? decoded.exp * 1000
        : Date.now() + 7 * 24 * 60 * 60 * 1000;
      const expiresAt = new Date(expMs);
      const tokenHash = hashToken(refreshToken);
      await repo.addRefreshToken({ userId: admin.id, tokenHash, expiresAt });
    } catch (e) {
      // تجاهل أي خطأ في حالة عدم وجود جدول
    }

    return { accessToken, refreshToken, user: sanitize(admin) };
  }

  // تسجيل الدخول العادي
  const user = await repo.findByUsername(username);
  if (!user) {
    const err = new Error("invalid credentials");
    err.status = 401;
    throw err;
  }

  const ok = await bcrypt.compare(password, user.password_hash || "");
  if (!ok) {
    const err = new Error("invalid credentials");
    err.status = 401;
    throw err;
  }

  if (user.active === 0 || user.active === false) {
    const err = new Error("user disabled");
    err.status = 403;
    throw err;
  }

  const accessToken = signAccess(user);
  const refreshToken = signRefresh(user);

  // تخزين refresh token في قاعدة البيانات
  try {
    const decoded = jwt.decode(refreshToken);
    const expMs = decoded?.exp
      ? decoded.exp * 1000
      : Date.now() + 7 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(expMs);
    const tokenHash = hashToken(refreshToken);
    await repo.addRefreshToken({ userId: user.id, tokenHash, expiresAt });
  } catch (e) {
    // تجاهل الخطأ إذا لم يكن جدول refresh_tokens موجودًا
  }

  return { accessToken, refreshToken, user: sanitize(user) };
}

export async function checkInitialized() {
  const exists = await hasAnyUser();
  return { initialized: exists };
}

/**
 * تجديد الوصول: يتحقق من وجود refresh token في قاعدة البيانات وسريانه،
 * ثم يتحقق من توقيع JWT ويعيد access token جديد.
 */
export async function refresh(token) {
  if (!token) {
    const err = new Error("no token");
    err.status = 400;
    throw err;
  }

  // التحقق من وجود الرمز في قاعدة البيانات وأنه غير منتهي
  const tokenHash = hashToken(token);
  const dbToken = await repo.findValidRefreshToken(tokenHash);
  if (!dbToken) {
    const err = new Error("invalid or expired token");
    err.status = 401;
    throw err;
  }

  // التحقق من صحة توقيع الرمز
  let payload;
  try {
    payload = verifyRefresh(token);
  } catch (e) {
    // إذا كان التوقيع غير صالح، احذف السجل من قاعدة البيانات ثم ارفع الخطأ
    try {
      await repo.deleteRefreshToken(tokenHash);
    } catch (_) {
      /* ignore */
    }
    const err = new Error("invalid token");
    err.status = 401;
    throw err;
  }

  const user = await repo.findById(payload.id);
  if (!user) {
    await repo.deleteRefreshToken(tokenHash);
    const err = new Error("not found");
    err.status = 404;
    throw err;
  }

  if (user.active === 0 || user.active === false) {
    await repo.deleteRefreshToken(tokenHash);
    const err = new Error("user disabled");
    err.status = 403;
    throw err;
  }

  // إصدار access token جديد
  const accessToken = signAccess(user);
  return { accessToken };
}

function sanitize(u) {
  const { password_hash, ...rest } = u || {};
  return rest;
}

function hashToken(raw) {
  return crypto.createHash("sha256").update(String(raw)).digest("hex");
}

export async function verifyPasswordToken(rawToken) {
  const tokenHash = hashToken(rawToken);
  const rec = await repo.findActiveTokenByHash(tokenHash);
  if (!rec) {
    return { valid: false, reason: "invalid_or_used_or_expired" };
  }
  return {
    valid: true,
    userId: rec.user_id,
    expiresAt: rec.expires_at,
  };
}

export async function setPasswordWithToken({ token, newPassword }) {
  // 1) جلب التوكن الصالح
  const tokenHash = hashToken(token);
  const rec = await repo.findActiveTokenByHash(tokenHash);
  if (!rec) {
    throw Object.assign(new Error("الرابط غير صالح أو منتهي"), {
      status: 400,
    });
  }

  // 2) جلب المستخدم
  const user = await repo.getUserById(rec.user_id);
  if (!user) {
    throw Object.assign(new Error("المستخدم غير موجود"), { status: 404 });
  }

  // 3) تحديث كلمة المرور والإعداد
  const hash = await bcrypt.hash(String(newPassword), 10);
  await repo.updateUserPasswordAndFlags(user.id, {
    password_hash: hash,
    must_change_password: false,
  });

  // 4) تعليم التوكن كمستخدم
  await repo.markPasswordTokenUsed(rec.id);

  // 5) إلغاء كل refresh tokens الخاصة بالمستخدم
  await repo.revokeRefreshTokensForUser(user.id);
}
