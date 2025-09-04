// server/src/modules/distributors/distributors.repo.js
import db from "../../db/knex.js";

export function search({ search, active } = {}) {
  const q = db("distributors as s")
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
      // ناخذ قيمة واحدة ثابتة من users لتفادي التكرار
      db.raw("MAX(u.username) as username"),
      db.raw("MAX(u.must_change_password) as must_change_password"),
      db.raw(
        "(SELECT COUNT(*) FROM orders o WHERE o.distributor_id = s.id) AS orders_count"
      )
    )
    .groupBy(
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
      "s.created_at"
    );

  if (active !== undefined) {
    q.where("s.active", active ? 1 : 0);
  }

  if (search) {
    const sTerm = `%${String(search).trim()}%`;
    q.where(function () {
      this.where("s.name", "like", sTerm)
        .orWhere("s.phone", "like", sTerm)
        .orWhere("s.phone2", "like", sTerm);
    });
  }

  return q.orderBy("s.id", "desc");
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
  const inserted = await db("distributors").insert({
    name,
    phone,
    phone2,
    address,
    notes,
    id_image_url,
    vehicle_plate,
    vehicle_type,
    vehicle_model,
    company_vehicle: company_vehicle ? 1 : 0,
    responsible_areas,
    active: 1,
  });

  const id = Array.isArray(inserted) ? inserted[0] : inserted;
  return db("distributors").where({ id }).first();
}

export async function getDistributorById(id) {
  return db("distributors as s")
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
      db.raw("MAX(u.username) as username"),
      db.raw("MAX(u.must_change_password) as must_change_password")
    )
    .where("s.id", id)
    .groupBy(
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
      "s.created_at"
    )
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
  if (company_vehicle !== undefined)
    patch.company_vehicle = company_vehicle ? 1 : 0;
  if (responsible_areas !== undefined)
    patch.responsible_areas = responsible_areas;
  if (active !== undefined) patch.active = active ? 1 : 0;

  await db("distributors").where({ id }).update(patch);
  return db("distributors").where({ id }).first();
}

export async function ensureUniqueUsername(base) {
  let candidate = base;
  let i = 1;
  while (true) {
    const exists = await db("users").where({ username: candidate }).first();
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
  const inserted = await db("users").insert({
    username,
    password_hash,
    role,
    distributor_id,
    must_change_password,
    active,
  });
  const id = Array.isArray(inserted) ? inserted[0] : inserted;
  return db("users").where({ id }).first();
}

export async function getUserByDistributorId(distributorId) {
  return db("users").where({ distributor_id: distributorId }).first();
}

export async function getUserIdsByDistributor(distributorId) {
  const rows = await db("users")
    .where({ distributor_id: distributorId })
    .select("id");
  return rows.map((r) => r.id);
}

export async function revokeRefreshTokensForUsers(userIds) {
  await db("refresh_tokens").whereIn("user_id", userIds).del();
}

export async function insertPasswordSetToken({
  user_id,
  token_hash,
  expires_at,
}) {
  const inserted = await db("password_set_tokens").insert({
    user_id,
    token_hash,
    expires_at,
  });
  const id = Array.isArray(inserted) ? inserted[0] : inserted;
  return db("password_set_tokens").where({ id }).first();
}

export async function setUsersActiveByDistributor(distributorId, active) {
  const newValue = active ? 1 : 0;
  await db("users")
    .where({ distributor_id: distributorId })
    .update({ active: newValue });
}

export async function transferCustomers(fromDistributorId, toDistributorId) {
  return db("customers")
    .where({ distributor_id: fromDistributorId })
    .update({ distributor_id: toDistributorId });
}
