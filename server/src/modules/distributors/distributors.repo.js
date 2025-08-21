import knex from "../../db.js";

export function search({ search } = {}) {
  const q = knex("distributors as s")
    .select(
      "s.id",
      "s.name",
      "s.phone",
      "s.address",
      "s.notes",
      "s.active",
      "s.created_at",
      knex.raw(
        "(select count(*) from orders o where o.distributor_id = s.id) as orders_count"
      )
    )
    .orderBy("s.id", "desc");

  if (search) {
    const s = `%${String(search).trim()}%`;
    q.where(function () {
      this.where("s.name", "like", s).orWhere("s.phone", "like", s);
    });
  }
  return q;
}

export async function createDistributor({ name, phone, address, notes }) {
  const inserted = await knex("distributors").insert({
    name,
    phone,
    address,
    notes,
    active: true,
  });
  const id = Array.isArray(inserted) ? inserted[0] : inserted;
  return knex("distributors").where({ id }).first();
}

export async function getDistributorById(id) {
  return knex("distributors").where({ id }).first();
}

export async function updateDistributor(
  id,
  { name, phone, address, notes, active }
) {
  const patch = {};
  if (name !== undefined) patch.name = name;
  if (phone !== undefined) patch.phone = phone;
  if (address !== undefined) patch.address = address;
  if (notes !== undefined) patch.notes = notes;
  if (active !== undefined) patch.active = !!active;

  await knex("distributors").where({ id }).update(patch);
  return knex("distributors").where({ id }).first();
}

export async function ensureUniqueUsername(base) {
  let candidate = base;
  let i = 1;
  while (true) {
    const exists = await knex("users").where({ username: candidate }).first();
    if (!exists) return candidate;
    candidate = `${base}_${i++}`;
  }
}

export async function createUser({
  username,
  password_hash,
  role,
  distributor_id,
  must_change_password,
  active,
}) {
  const inserted = await knex("users").insert({
    username,
    password_hash,
    role,
    distributor_id,
    must_change_password,
    active,
  });
  const id = Array.isArray(inserted) ? inserted[0] : inserted;
  return knex("users").where({ id }).first();
}

export async function getUserByDistributorId(distributorId) {
  return knex("users").where({ distributor_id: distributorId }).first();
}

export async function getUserIdsByDistributor(distributorId) {
  const rows = await knex("users")
    .where({ distributor_id: distributorId })
    .select("id");
  return rows.map((r) => r.id);
}

export async function revokeRefreshTokensForUsers(userIds) {
  // احذف/أبطل كل ريفرش توكنز للمستخدمين
  await knex("refresh_tokens").whereIn("user_id", userIds).del();
}

// password_set_tokens: id, user_id, token_hash, expires_at, used_at NULL
export async function insertPasswordSetToken({
  user_id,
  token_hash,
  expires_at,
}) {
  const inserted = await knex("password_set_tokens").insert({
    user_id,
    token_hash,
    expires_at,
  });
  const id = Array.isArray(inserted) ? inserted[0] : inserted;
  return knex("password_set_tokens").where({ id }).first();
}
