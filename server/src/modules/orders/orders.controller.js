import * as svc from "./orders.service.js";

export async function create(req, res, next) {
  try {
    const out = await svc.create(req.body, req.user);
    res.status(201).json(out);
  } catch (e) {
    next(e);
  }
}

export async function list(req, res, next) {
  try {
    const out = await svc.list(req.query, req.user);
    // توحيد الاستجابة مع DataTable عندك
    res.json(
      Array.isArray(out?.rows) ? out : { items: out.rows, total: out.total }
    );
  } catch (e) {
    next(e);
  }
}

export async function listDrafts(req, res, next) {
  try {
    const out = await svc.list(
      { status: "draft", includeDrafts: true },
      req.user
    );
    res.json(
      Array.isArray(out?.rows) ? out : { items: out.rows, total: out.total }
    );
  } catch (e) {
    next(e);
  }
}

export async function remove(req, res, next) {
  try {
    const id = Number(req.params.id);
    await svc.remove(id, req.user);
    // لا محتوى
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}

export async function show(req, res, next) {
  try {
    const id = Number(req.params.id);
    const out = await svc.show(id);
    res.json(out);
  } catch (e) {
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const out = await svc.update(id, req.body, req.user);
    res.json(out);
  } catch (e) {
    next(e);
  }
}

export async function listByCustomer(req, res, next) {
  try {
    const customerId = Number(req.params.customerId);
    const out = await svc.getCustomerOrders(customerId, req.query, req.user);
    res.json(out);
  } catch (e) {
    next(e);
  }
}
