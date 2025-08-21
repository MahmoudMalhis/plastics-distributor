// src/config/env.js
import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 4000,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  BASE_UPLOAD_DIR: process.env.BASE_UPLOAD_DIR || "./uploads",
  MAX_IMAGE_MB: Number(process.env.MAX_IMAGE_MB || 2),
  ALLOWED_IMAGE_TYPES: (
    process.env.ALLOWED_IMAGE_TYPES || "jpg,png,webp"
  ).split(","),
  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
  VAPID_SUBJECT: process.env.VAPID_SUBJECT || "mailto:admin@example.com",
};
