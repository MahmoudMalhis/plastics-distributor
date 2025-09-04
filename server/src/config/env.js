// src/config/env.js
import dotenv from "dotenv";
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || "development";
const isProd = NODE_ENV === "production";

const toInt = (v, fallback) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};

const toList = (v, fallback = []) =>
  (v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean).length
    ? (v ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : fallback;

export const env = {
  // بيئة التشغيل
  NODE_ENV,
  isProd,

  // الشبكة
  PORT: toInt(process.env.PORT, 4000),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:5173",

  // أسرار JWT
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,

  // الرفع/الصور
  BASE_UPLOAD_DIR: process.env.BASE_UPLOAD_DIR || "./uploads",
  MAX_IMAGE_MB: toInt(process.env.MAX_IMAGE_MB, 2),
  ALLOWED_IMAGE_TYPES: toList(process.env.ALLOWED_IMAGE_TYPES, [
    "jpg",
    "png",
    "webp",
  ]),

  // Web Push (VAPID)
  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
  VAPID_SUBJECT: process.env.VAPID_SUBJECT || "mailto:admin@example.com",

  // مساحة للاحتياج المستقبلي (مثل DATABASE_URL…)
  DATABASE_URL: process.env.DATABASE_URL || null,
};

// تحقّق بسيط في الإنتاج: أسرار الـ JWT مطلوبة
if (env.isProd) {
  const missing = [];
  if (!env.JWT_ACCESS_SECRET) missing.push("JWT_ACCESS_SECRET");
  if (!env.JWT_REFRESH_SECRET) missing.push("JWT_REFRESH_SECRET");
  if (missing.length) {
    // eslint-disable-next-line no-console
    console.error(
      `❌ Missing required env vars in production: ${missing.join(", ")}`
    );
    throw new Error("Missing required environment variables");
  }
}

// افتراضيًا، نصدّر env
export default env;
