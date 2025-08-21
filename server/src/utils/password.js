import crypto from "crypto";

// كلمة مرور مؤقتة عشوائية
export function randomPassword(len = 10) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < len; i++)
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

// توكن قصير الأجل لمرة واحدة (لتعيين كلمة المرور)
export function randomToken(ttlSeconds = 900) {
  const token = crypto.randomBytes(24).toString("base64url"); // صغير وجاهز للرابط
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  return { token, hash, expiresAt };
}
