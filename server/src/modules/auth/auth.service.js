import * as repo from "./auth.repo.js";
import bcrypt from "bcrypt";
import { signAccess, signRefresh, verifyRefresh } from "../../core/auth/jwt.js";
import { hasAnyUser } from "./auth.repo.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import * as bootstrapRepo from "./bootstrap.repo.js"; // ملف جديد ستضيفه بالخطوة 3

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
    const err = new Error("system not initialized");
    err.status = 403;
    throw err;
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

export async function issueBootstrapToken(req) {
  const total = await repo.countUsers();
  if (total > 0) {
    const err = new Error("already initialized");
    err.status = 409;
    throw err;
  }

  const ttlMin = Number(process.env.BOOTSTRAP_TTL_MIN || 15);
  const exp = new Date(Date.now() + ttlMin * 60 * 1000);

  const raw = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(raw);

  const ip = getIp(req);
  const ua = (req.headers["user-agent"] || "").toString();

  const active = await bootstrapRepo.getActiveToken();
  if (active) {
    // لو نفس الجهاز (IP/UA) دوّر التوكن بدل 409
    if (active.issued_ip === ip && active.issued_ua === ua) {
      await bootstrapRepo.rotateToken(active.id, {
        tokenHash,
        ip,
        ua,
        expiresAt: exp,
      });
      return { raw, exp };
    }
    // في الديف سهّلها: ألغِ أي توكنات نشطة وأصدر جديد
    if ((process.env.NODE_ENV || "development") !== "production") {
      await bootstrapRepo.invalidateAllActive();
      await bootstrapRepo.createToken({ tokenHash, ip, ua, expiresAt: exp });
      return { raw, exp };
    }
    // في الإنتاج أبقِ 409
    const err = new Error("bootstrap token already issued");
    err.status = 409;
    throw err;
  }

  await bootstrapRepo.createToken({ tokenHash, ip, ua, expiresAt: exp });
  return { raw, exp };
}

export async function setupInitialAdminViaToken(req, { username, password }) {
  username = String(username || "").trim();
  password = String(password || "").trim();

  if (!username || !password) {
    const err = new Error("username/password required");
    err.status = 400;
    throw err;
  }

  // لا نسمح إن وُجد مستخدمون
  const total = await repo.countUsers();
  if (total > 0) {
    const err = new Error("already initialized");
    err.status = 409;
    throw err;
  }

  // نقرأ توكن البوتستراب من كوكي HttpOnly "bt"
  const raw = req.cookies?.bt;
  if (!raw) {
    const e = new Error("missing bootstrap token");
    e.status = 403;
    throw e;
  }

  const tokenHash = hashToken(raw);
  const ip = getIp(req);
  const ua = (req.headers["user-agent"] || "").toString();

  const row = await bootstrapRepo.findValidToken({ tokenHash, ip, ua });
  if (!row) {
    const e = new Error("invalid or expired bootstrap token");
    e.status = 403;
    throw e;
  }

  // إنشاء الأدمن
  const password_hash = await bcrypt.hash(password, 10);
  const admin = await repo.createUser({
    username,
    password_hash,
    role: "admin",
    active: true,
    must_change_password: true,
  });

  // إصدار التوكنات
  const accessToken = signAccess(admin);
  const refreshToken = signRefresh(admin);

  // تخزين refresh token كتجزئة + تاريخ انتهاء
  try {
    const decoded = jwt.decode(refreshToken);
    const expMs = decoded?.exp
      ? decoded.exp * 1000
      : Date.now() + 365 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(expMs);
    const rHash = hashToken(refreshToken);
    await repo.addRefreshToken({
      userId: admin.id,
      tokenHash: rHash,
      expiresAt,
    });
  } catch (_) {}

  // تعليم التوكن كمستخدم
  await bootstrapRepo.markUsed(row.id);

  return { accessToken, refreshToken, user: sanitize(admin) };
}
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

function getIp(req) {
  const xf = (req.headers["x-forwarded-for"] || "")
    .toString()
    .split(",")[0]
    .trim();
  return xf || req.ip || req.connection?.remoteAddress || "unknown";
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
