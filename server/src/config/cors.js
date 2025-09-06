// src/config/cors.js
import cors from "cors";
import { env } from "./env.js";

const allowedOrigins = ["http://localhost:5173", env.CLIENT_ORIGIN].filter(
  Boolean
);

export default cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Disposition"],
  optionsSuccessStatus: 204,
});
