// src/modules/categories/categories.controller.js
import * as svc from "./categories.service.js";

export async function list(req, res, next) {
  try {
    const rows = await svc.list();
    res.json(rows);
  } catch (e) { next(e); }
}

export async function create(req, res, next) {
  try {
    const data = await svc.create({ name: req.body.name });
    res.status(201).json(data);
  } catch (e) { next(e); }
}

export async function update(req, res, next) {
  try {
    const data = await svc.update(Number(req.params.id), { name: req.body.name });
    res.json(data);
  } catch (e) { next(e); }
}

export async function remove(req, res, next) {
  try {
    await svc.remove(Number(req.params.id));
    res.json({ ok: true });
  } catch (e) { next(e); }
}
