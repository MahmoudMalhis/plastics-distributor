// src/config/cors.js
import cors from "cors";
import { ENV } from "./env.js";

/**
 * السماح للواجهة (Vite) بالوصول للـ API بما في ذلك هيدر Authorization.
 * - origin: true (يعيد نفس Origin في الرد)
 * - allowedHeaders: تضمين Authorization مهم جدًا
 * - credentials: true لو بتستخدم كوكيز/سيشن، ممكن تخليها false لو لا تحتاج
 */
const allowedOrigins = [
  "http://localhost:5173", // Vite dev
  ENV.CLIENT_ORIGIN, // اختياري: من .env لو حاطه
].filter(Boolean);

const corsMw = cors({
  origin: (origin, cb) => {
    // السماح من Postman/curl (بدون Origin) أو من origins المعرّفة
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true, // فعّلها فقط إذا كنت ترسل كوكيز عبر المتصفح
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization", // ← مهم لهيدر التوكن
    "X-Requested-With",
  ],
  exposedHeaders: [
    "Content-Disposition", // لو بترجع ملفات/تنزيلات
  ],
  optionsSuccessStatus: 204, // بعض المتصفحات تفضّل 204 للـ preflight
});

export default corsMw;
