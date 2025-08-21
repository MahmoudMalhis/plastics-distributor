// src/modules/auth/auth.controller.js
import * as svc from "./auth.service.js";

export async function login(req, res) {
  try {
    const { username, password } = req.body || {};
    const result = await svc.login(username, password);
    res.json(result);
  } catch (e) {
    res.status(e?.status || 500).json({ error: e?.message || "Server error" });
  }
}

export async function initialized(req, res, next) {
  try {
    const data = await svc.checkInitialized();
    res.json(data); // { initialized: true/false }
  } catch (e) {
    next(e);
  }
}

export async function refresh(req, res) {
  try {
    const { refreshToken } = req.body || {};
    const result = await svc.refresh(refreshToken);
    res.json(result);
  } catch (e) {
    res.status(e?.status || 401).json({ error: e?.message || "invalid token" });
  }
}

export async function verifyPasswordToken(req, res, next) {
  try {
    const token = String(req.query.token || "").trim();
    if (!token) return res.status(400).json({ error: "token مطلوب" });

    const out = await svc.verifyPasswordToken(token);
    res.json(out);
  } catch (e) {
    next(e);
  }
}

export async function setPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) {
      return res.status(400).json({ error: "token و newPassword مطلوبة" });
    }
    await svc.setPasswordWithToken({ token, newPassword });
    res.json({ ok: true, message: "تم تعيين كلمة المرور بنجاح" });
  } catch (e) {
    next(e);
  }
}
