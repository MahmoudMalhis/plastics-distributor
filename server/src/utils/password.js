import crypto from "crypto";

export function randomPassword(len = 10) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < len; i++)
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

export function randomToken(ttlSeconds = 900) {
  const token = crypto.randomBytes(24).toString("base64url");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  return { token, hash, expiresAt };
}
