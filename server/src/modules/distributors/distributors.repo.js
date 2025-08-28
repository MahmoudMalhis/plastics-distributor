import knex from "../../db.js";

export function search({ search, active } = {}) {
  const q = knex("distributors as s")
    .leftJoin("users as u", "u.distributor_id", "s.id")
    .select(
      "s.id",
      "s.name",
      "s.phone",
      "s.phone2",
      "s.address",
      "s.notes",
      "s.id_image_url",
      "s.vehicle_plate",
      "s.vehicle_type",
      "s.vehicle_model",
      "s.company_vehicle",
      "s.responsible_areas",
      "s.active",
      "s.created_at",
      "u.username",
      "u.must_change_password",
      knex.raw(
        "(select count(*) from orders o where o.distributor_id = s.id) as orders_count"
      )
    );

  if (active !== undefined) {
    q.where("s.active", !!active);
  }

  if (search) {
    const s = `%${String(search).trim()}%`;
    q.where(function () {
      this.where("s.name", "like", s).orWhere("s.phone", "like", s);
    });
  }
  return q;
}

export async function createDistributor({
  name,
  phone,
  phone2,
  address,
  notes,
  id_image_url,
  vehicle_plate,
  vehicle_type,
  vehicle_model,
  company_vehicle,
  responsible_areas,
}) {
  const inserted = await knex("distributors").insert({
    name,
    phone,
    phone2,
    address,
    notes,
    id_image_url,
    vehicle_plate,
    vehicle_type,
    vehicle_model,
    company_vehicle,
    responsible_areas,
    active: true,
  });
  const id = Array.isArray(inserted) ? inserted[0] : inserted;
  return knex("distributors").where({ id }).first();
}

export async function getDistributorById(id) {
  return knex("distributors as s")
    .leftJoin("users as u", "u.distributor_id", "s.id")
    .select(
      "s.id",
      "s.name",
      "s.phone",
      "s.phone2",
      "s.address",
      "s.notes",
      "s.id_image_url",
      "s.vehicle_plate",
      "s.vehicle_type",
      "s.vehicle_model",
      "s.company_vehicle",
      "s.responsible_areas",
      "s.active",
      "s.created_at",
      "u.username",
      "u.must_change_password"
    )
    .where("s.id", id)
    .first();
}

export async function updateDistributor(
  id,
  {
    name,
    phone,
    phone2,
    address,
    notes,
    id_image_url,
    vehicle_plate,
    vehicle_type,
    vehicle_model,
    company_vehicle,
    responsible_areas,
    active,
  }
) {
  const patch = {};
  if (name !== undefined) patch.name = name;
  if (phone !== undefined) patch.phone = phone;
  if (phone2 !== undefined) patch.phone2 = phone2;
  if (address !== undefined) patch.address = address;
  if (notes !== undefined) patch.notes = notes;
  if (id_image_url !== undefined) patch.id_image_url = id_image_url;
  if (vehicle_plate !== undefined) patch.vehicle_plate = vehicle_plate;
  if (vehicle_type !== undefined) patch.vehicle_type = vehicle_type;
  if (vehicle_model !== undefined) patch.vehicle_model = vehicle_model;
  if (company_vehicle !== undefined) patch.company_vehicle = !!company_vehicle;
  if (responsible_areas !== undefined)
    patch.responsible_areas = responsible_areas;
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

export async function setUsersActiveByDistributor(distributorId, active) {
  const newValue = !!active;
  await knex("users")
    .where({ distributor_id: distributorId })
    .update({ active: newValue });
}

export async function transferCustomers(fromDistributorId, toDistributorId) {
  return knex("customers")
    .where({ distributor_id: fromDistributorId })
    .update({ distributor_id: toDistributorId });
}
