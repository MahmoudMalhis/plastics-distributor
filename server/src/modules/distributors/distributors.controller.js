import * as svc from "./distributors.service.js";

export async function list(req, res, next) {
  try {
    const rows = await svc.list(req.query);
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

export async function create(req, res, next) {
  try {
    const { name, phone, address, notes, username } = req.body;
    const result = await svc.create({
      name,
      phone,
      address,
      notes,
      username,
    });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const data = await svc.update(id, req.body);
    res.json(data);
  } catch (e) {
    next(e);
  }
}

export async function issuePasswordToken(req, res, next) {
  try {
    const id = Number(req.params.id);
    const payload = await svc.issuePasswordToken(id);
    res.json(payload);
  } catch (e) {
    next(e);
  }
}

export async function getMyProfile(req, res, next) {
  try {
    const myDistributorId = req.user?.distributorId;
    if (!myDistributorId)
      return res.status(404).json({ error: "distributor not linked" });

    const distributor = await svc.getById(myDistributorId);
    if (!distributor) return res.status(404).json({ error: "not found" });

    return res.json(distributor);
  } catch (e) {
    next(e);
  }
}

export async function getOne(req, res, next) {
  try {
    const distributorId = Number(req.params.id || 0);
    if (!distributorId) return res.status(400).json({ error: "invalid id" });

    const isAdmin = req.user?.role === "admin";
    const isOwner =
      req.user?.role === "distributor" &&
      req.user?.distributorId === distributorId;
    if (!isAdmin && !isOwner)
      return res.status(403).json({ error: "forbidden" });

    const distributor = await svc.getById(distributorId);
    if (!distributor) return res.status(404).json({ error: "not found" });

    return res.json(distributor);
  } catch (e) {
    next(e);
  }
}

export async function uploadIdImage(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "invalid id" });
    if (!req.file?.path) return res.status(400).json({ error: "لا توجد صورة" });
    const out = await svc.uploadIdImage(id, req.file.path);
    res.json(out);
  } catch (e) {
    next(e);
  }
}
