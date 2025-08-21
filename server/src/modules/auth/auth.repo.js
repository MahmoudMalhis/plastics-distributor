// server/src/modules/auth/auth.repo.js
import db from "../../db/knex.js";

export async function hasAnyUser() {
  const row = await db("users").count({ c: "*" }).first();
  return Number(row?.c || 0) > 0;
}

export async function countUsers() {
  const row = await db("users").count({ count: "id" }).first();
  const count = Number(
    row?.count ?? row?.["count(`id`)"] ?? row?.["COUNT(*)"] ?? 0
  );
  return count;
}

export function findByUsername(username) {
  if (!username) return null;
  return db("users").where({ username }).first();
}

export function findById(id) {
  return db("users").where({ id }).first();
}

export async function createUser({
  username,
  password_hash,
  role = "admin",
  active = true,
  must_change_password = true,
  distributor_id = null,
}) {
  const [insertId] = await db("users").insert({
    username,
    password_hash,
    role,
    active,
    must_change_password,
    distributor_id,
    created_at: db.fn.now(),
  });
  const id = typeof insertId === "object" ? insertId?.insertId : insertId;
  return findById(id);
}

export async function findActiveTokenByHash(tokenHash) {
  const row = await db("password_set_tokens")
    .where({ token_hash: tokenHash })
    .whereNull("used_at")
    .andWhere("expires_at", ">", db.fn.now())
    .orderBy("id", "desc")
    .first();
  return row || null;
}

export async function markPasswordTokenUsed(id) {
  return db("password_set_tokens")
    .where({ id })
    .update({ used_at: db.fn.now() });
}

export function getUserById(id) {
  return db("users").where({ id }).first();
}

export async function updateUserPasswordAndFlags(
  userId,
  { password_hash, must_change_password }
) {
  const patch = {};
  if (password_hash !== undefined) patch.password_hash = password_hash;
  if (typeof must_change_password === "boolean")
    patch.must_change_password = must_change_password;

  await db("users").where({ id: userId }).update(patch);
  return db("users").where({ id: userId }).first();
}

export async function revokeRefreshTokensForUser(userId) {
  try {
    await db("refresh_tokens").where({ user_id: userId }).del();
  } catch (e) {
    if (String(e?.code) !== "ER_NO_SUCH_TABLE") throw e;
  }
}
