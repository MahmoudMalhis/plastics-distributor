import * as svc from "./customers.service.js";

function normalizeUser(u) {
  if (!u) return u;
  const role =
    u.role && String(u.role).trim()
      ? u.role
      : u.distributor_id != null
      ? "distributor"
      : "admin";
  return {
    ...u,
    role,
    distributor_id: u.distributor_id ?? null,
    active: u.active ?? true,
  };
}

export async function list(req, res, next) {
  try {
    const rows = await svc.list(req.query, normalizeUser(req.user));
    res.json(Array.isArray(rows) ? rows : { items: rows });
  } catch (e) {
    next(e);
  }
}

export async function create(req, res, next) {
  try {
    const out = await svc.create(req.body, normalizeUser(req.user));
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
    const out = await svc.update(id, req.body, normalizeUser(req.user));
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

export async function getStatement(req, res, next) {
  try {
    const customerId = Number(req.params.id || 0);
    if (!Number.isFinite(customerId)) {
      return res.status(400).json({ error: "id غير صالح" });
    }

    if (req.user?.role === "distributor") {
      const row = await customersRepo.getById(customerId);
      if (!row || row.distributor_id !== req.user.distributorId) {
        return res.status(403).json({ error: "forbidden" });
      }
    }

    const { from, to, limit } = req.query || {};
    const out = await svc.getStatement({
      customerId,
      from: from ? new Date(from) : null,
      to: to ? new Date(to) : null,
      limit: Number(limit) || 200,
    });

    return res.json(out);
  } catch (e) {
    next(e);
  }
}

export async function timeline(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { page = 1, limit = 50 } = req.query || {};
    const out = await svc.timeline(
      id,
      { page: Number(page), limit: Number(limit) },
      normalizeUser(req.user)
    );
    res.json(out);
  } catch (e) {
    next(e);
  }
}
