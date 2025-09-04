// src/core/files/multer.js
import multer from "multer";
import path from "path";
import fs from "fs";
import { env } from "../../config/env.js";

const TMP_DIR = path.join(env.BASE_UPLOAD_DIR || "./uploads", "products");

// تأكد من وجود مجلد الرفع المؤقّت
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

function fileFilter(req, file, cb) {
  const allowed = (env.ALLOWED_IMAGE_TYPES || []).map((t) =>
    t.trim().toLowerCase()
  );
  // تكييف الـ mimetype إلى امتداد (بسيط)
  const ext = (file.mimetype || "").split("/").pop().toLowerCase(); // jpeg/png/webp
  const okExt = ext === "jpeg" ? "jpg" : ext; // jpeg → jpg
  if (allowed.includes(okExt)) return cb(null, true);
  cb(new Error(`نوع الصورة غير مسموح. المسموح: ${allowed.join(", ")}`));
}

const storage = multer.diskStorage({
  destination: TMP_DIR,
  filename: (req, file, cb) => {
    // اسم مؤقّت؛ المعالجة لاحقًا ستولّد الاسم النهائي
    const ts = Date.now();
    const ext = path.extname(file.originalname || "").toLowerCase() || ".img";
    cb(null, `${ts}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: (env.MAX_IMAGE_MB || 2) * 1024 * 1024, // MB
  },
});

// للاستخدام السريع في الراوت
export const singleImage = upload.single("image");
