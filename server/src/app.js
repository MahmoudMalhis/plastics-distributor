// src/app.js
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import corsMw from "./config/cors.js";
import { ENV } from "./config/env.js";
import routes from "./routes.js";

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // اسمح بتحميل الموارد من أصول مختلفة
  })
);
app.use(corsMw);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Rate limit على /api/auth/login فقط
const loginLimiter = rateLimit({ windowMs: 60 * 1000, max: 5 });
app.use("/api/auth/login", loginLimiter);

// static uploads
app.use("/uploads", express.static("uploads"));

// all routes under /api
app.use("/api", routes);

// 404
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

export default app;
