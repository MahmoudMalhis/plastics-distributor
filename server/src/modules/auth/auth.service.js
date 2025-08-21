import * as repo from "./auth.repo.js";
import bcrypt from "bcrypt";
import { signAccess, signRefresh, verifyRefresh } from "../../core/auth/jwt.js";
import { hasAnyUser } from "./auth.repo.js";
import crypto from "crypto";

export async function login(username, password) {
  username = String(username || "").trim();
  password = String(password || "");

  if (!username || !password) {
    const err = new Error("username/password required");
    err.status = 400;
    throw err;
  }

  // ⬇️ BOOTSTRAP: لو ما في أي مستخدم → أنشئ أدمن من بيانات الفورم
  const total = await repo.countUsers();
  if (total === 0) {
    const password_hash = await bcrypt.hash(password, 10);
    const admin = await repo.createUser({
      username,
      password_hash,
      role: "admin",
      active: true,
      must_change_password: true, // يجبره يغيّر كلمة المرور بعد الدخول
    });
    const accessToken = signAccess(admin);
    const refreshToken = signRefresh(admin);
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
  return { accessToken, refreshToken, user: sanitize(user) };
}

export async function checkInitialized() {
  const exists = await hasAnyUser();
  return { initialized: exists };
}

export async function refresh(token) {
  if (!token) {
    const err = new Error("no token");
    err.status = 400;
    throw err;
  }
  const payload = verifyRefresh(token);
  const user = await repo.findById(payload.id);
  if (!user) {
    const err = new Error("not found");
    err.status = 404;
    throw err;
  }
  if (user.active === 0 || user.active === false) {
    const err = new Error("user disabled");
    err.status = 403;
    throw err;
  }
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
  // 1) لقِ التوكن الصالح
  const tokenHash = hashToken(token);
  const rec = await repo.findActiveTokenByHash(tokenHash);
  if (!rec) {
    throw Object.assign(new Error("الرابط غير صالح أو منتهي"), { status: 400 });
  }

  // 2) لقِ المستخدم
  const user = await repo.getUserById(rec.user_id);
  if (!user) {
    throw Object.assign(new Error("المستخدم غير موجود"), { status: 404 });
  }

  // 3) حدّث كلمة المرور + must_change_password
  const hash = await bcrypt.hash(String(newPassword), 10);
  await repo.updateUserPasswordAndFlags(user.id, {
    password_hash: hash,
    must_change_password: false,
  });

  // 4) علِّم التوكن مستعمل
  await repo.markPasswordTokenUsed(rec.id);

  // 5) أبطِل كل refresh tokens للمستخدم (لو عندك الجدول)
  await repo.revokeRefreshTokensForUser(user.id);
}
