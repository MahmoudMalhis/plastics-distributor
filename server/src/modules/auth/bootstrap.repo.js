import knex from "../../db/knex.js";

export async function getActiveToken() {
  return knex("bootstrap_tokens")
    .whereNull("used_at")
    .andWhere("expires_at", ">", knex.fn.now())
    .first();
}

export async function createToken({ tokenHash, ip, ua, expiresAt }) {
  await knex("bootstrap_tokens").insert({
    token_hash: tokenHash,
    issued_ip: ip,
    issued_ua: ua,
    expires_at: expiresAt,
  });
}

export async function findValidToken({ tokenHash, ip, ua }) {
  const row = await knex("bootstrap_tokens")
    .where({ token_hash: tokenHash })
    .whereNull("used_at")
    .andWhere("expires_at", ">", knex.fn.now())
    .first();
  if (!row) return null;
  // ربط بسيط بـ IP/UA لتقليل الاختطاف
  if (row.issued_ip !== ip) return null;
  if (row.issued_ua !== ua) return null;
  return row;
}

export async function markUsed(id) {
  await knex("bootstrap_tokens")
    .where({ id })
    .update({ used_at: knex.fn.now() });
}

export async function cleanupExpired() {
  await knex("bootstrap_tokens")
    .where("expires_at", "<", knex.raw("CURRENT_TIMESTAMP - INTERVAL 7 DAY"))
    .del();
}

export async function rotateToken(id, { tokenHash, ip, ua, expiresAt }) {
  await knex("bootstrap_tokens").where({ id }).update({
    token_hash: tokenHash,
    issued_ip: ip,
    issued_ua: ua,
    expires_at: expiresAt,
    used_at: null,
  });
}

export async function invalidateAllActive() {
  await knex("bootstrap_tokens")
    .whereNull("used_at")
    .andWhere("expires_at", ">", knex.fn.now())
    .del();
}
