import db from "../../db/knex.js";

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
  // نختار الأحدث لو تكرر لسبب ما
  const row = await knex("password_set_tokens")
    .where({ token_hash: tokenHash })
    .whereNull("used_at")
    .andWhere("expires_at", ">", knex.fn.now())
    .orderBy("id", "desc")
    .first();

  return row || null;
}

export async function markPasswordTokenUsed(id) {
  return knex("password_set_tokens")
    .where({ id })
    .update({ used_at: knex.fn.now() });
}

export async function getUserById(id) {
  return knex("users").where({ id }).first();
}

export async function updateUserPasswordAndFlags(
  userId,
  { password_hash, must_change_password }
) {
  const patch = {};
  if (password_hash !== undefined) patch.password_hash = password_hash;
  if (typeof must_change_password === "boolean")
    patch.must_change_password = must_change_password;

  await knex("users").where({ id: userId }).update(patch);
  return knex("users").where({ id: userId }).first();
}

export async function revokeRefreshTokensForUser(userId) {
  // لو جدول refresh_tokens غير موجود عندك تجاهل النداء أو أنشئ الجدول (أنتي أنشأتيه مؤخراً 👍)
  try {
    await knex("refresh_tokens").where({ user_id: userId }).del();
  } catch (e) {
    // لا تكسر العملية لو الجدول غير موجود
    if (String(e?.code) !== "ER_NO_SUCH_TABLE") throw e;
  }
}
