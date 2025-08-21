import * as svc from "./products.service.js";

export async function list(req, res, next) {
  try {
    const rows = await svc.list({ ...req.query, user: req.user });
    res.json(Array.isArray(rows) ? rows : { items: rows });
  } catch (e) {
    next(e);
  }
}

export async function create(req, res, next) {
  try {
    const out = await svc.create(req.body);
    res.status(201).json(out);
  } catch (e) {
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const out = await svc.update(Number(req.params.id), req.body);
    res.json(out);
  } catch (e) {
    next(e);
  }
}

export async function archive(req, res, next) {
  try {
    await svc.archive(Number(req.params.id));
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

export async function restore(req, res, next) {
  try {
    await svc.restore(Number(req.params.id));
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

export async function uploadImage(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!req.file?.path) return res.status(400).json({ error: "لا توجد صورة" });

    // بناء المسار النسبي للصورة
    const relativePath = req.file.path.replace(
      /^.*[\\/]uploads[\\/]/,
      "/uploads/"
    );
    const out = await svc.attachImage(id, relativePath);

    res.json(out);
  } catch (e) {
    next(e);
  }
}
