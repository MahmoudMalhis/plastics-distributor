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
    // تحتوي على distributor + user + tempPassword (تُعرض مرة واحدة)
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
    // payload: { token, setUrl, waText, userId }
    res.json(payload);
  } catch (e) {
    next(e);
  }
}
