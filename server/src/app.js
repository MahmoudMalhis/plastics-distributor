// server/src/app.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import { env } from "./config/env.js";
import routes from "./routes.js";

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

if (env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  })
);

app.use(cookieParser());

app.use(
  express.json({
    limit: "1mb",
    strict: true,
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  })
);

app.set("trust proxy", 1);

app.get("/health", (_req, res) =>
  res.status(200).json({ ok: true, env: env.NODE_ENV })
);
app.use("/uploads", express.static("uploads"));
app.use("/api", routes);

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Not Found" });
  }
  return next();
});

app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message =
    env.NODE_ENV === "production" && status === 500
      ? "Internal Server Error"
      : err.message || "Internal Server Error";

  if (env.NODE_ENV !== "production") {
    console.error(err);
  }

  res.status(status).json({
    error: message,
  });
});

export default app;
