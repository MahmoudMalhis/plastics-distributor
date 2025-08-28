import * as svc from "./customers.service.js";

export async function list(req, res, next) {
  try {
    const rows = await svc.list(req.query);
    res.json(Array.isArray(rows) ? rows : { items: rows });
  } catch (e) {
    next(e);
  }
}

export async function create(req, res, next) {
  try {
    const out = await svc.create(req.body, req.user);
    res.status(201).json(out);
  } catch (e) {
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "id غير صالح" });
    }
    const out = await svc.update(id, req.body, req.user);
    res.json(out);
  } catch (e) {
    next(e);
  }
}

export async function show(req, res, next) {
  try {
    const id = Number(req.params.id);
    const data = await svc.getDetails(id);
    if (!data) return res.status(404).json({ error: "not found" });
    res.json(data);
  } catch (e) {
    next(e);
  }
}
