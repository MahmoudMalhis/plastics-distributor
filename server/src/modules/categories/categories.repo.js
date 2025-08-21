import db from "../../db/knex.js";

export function list() {
  return db("categories").select("*").orderBy("name");
}

export async function create({ name }) {
  const inserted = await db("categories").insert({ name });
  const insertedIdRaw = Array.isArray(inserted) ? inserted[0] : inserted;
  const id =
    typeof insertedIdRaw === "object"
      ? insertedIdRaw?.insertId ?? insertedIdRaw?.id
      : insertedIdRaw;
  const row = await db("categories").where({ id }).first();
  return row ?? { id, name };
}

export async function update(id, { name }) {
  await db("categories").where({ id }).update({ name });
  // أعد القراءة بعد التحديث
  const row = await db("categories").where({ id }).first();
  return row ?? { id, name };
}

export function remove(id) {
  return db("categories").where({ id }).del();
}
