// src/core/files/images.js
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import { ENV } from "../../config/env.js";

const BASE = ENV.BASE_UPLOAD_DIR || "./uploads";
const PRODUCTS_DIR = path.join(BASE, "products");

// تأكد من وجود مجلد products
await fs.mkdir(PRODUCTS_DIR, { recursive: true }).catch(() => {});

function randomId(n = 6) {
  return Math.random()
    .toString(36)
    .slice(2, 2 + n);
}

/**
 * معالجة صورة منتج:
 * @param {string} tmpPath - مسار الصورة المؤقتة من Multer
 * @param {object} opts - { prefix?: string }
 * @returns {Promise<{image_url: string, thumb_url: string}>}
 */
export async function processProductImage(tmpPath, { prefix = "prd" } = {}) {
  const base = `${prefix}-${Date.now()}-${randomId()}`;
  const mainFile = `${base}.webp`;
  const thumbFile = `${base}-thumb.webp`;

  const mainAbs = path.join(PRODUCTS_DIR, mainFile);
  const thumbAbs = path.join(PRODUCTS_DIR, thumbFile);

  // الرئيسية: عرض 800px، تدوير حسب EXIF، WEBP جودة 85
  await sharp(tmpPath)
    .rotate()
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(mainAbs);

  // المصغّرة: عرض 200px، WEBP جودة 80
  await sharp(tmpPath)
    .rotate()
    .resize({ width: 200, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(thumbAbs);

  // احذف الملف المؤقت
  await fs.unlink(tmpPath).catch(() => {});

  // مسارات relative ليستخدمها الـ client عبر /uploads
  const image_url = `/uploads/products/${mainFile}`;
  const thumb_url = `/uploads/products/${thumbFile}`;
  return { image_url, thumb_url };
}

/**
 * أرشفة صورة قديمة (اختياري — يمكنك نقلها بدل الحذف)
 * مثال ينقلها إلى uploads/archive/
 */
export async function archiveImage(relPath) {
  if (!relPath) return;
  try {
    const ARCHIVE_DIR = path.join(BASE, "archive");
    await fs.mkdir(ARCHIVE_DIR, { recursive: true });

    // relPath يبدأ بـ "/uploads/..." → حوّله لمسار مطلق
    const absPath = path.join(process.cwd(), relPath.replace(/^\//, ""));
    const filename = path.basename(absPath);
    await fs.rename(absPath, path.join(ARCHIVE_DIR, filename));
  } catch (_) {
    /* تجاهل */
  }
}
