export function validateCreate(req, res, next) {
  const { name, phone, username } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: "الاسم مطلوب" });
  }
  if (phone && !/^[\d+()\-\s]{6,20}$/.test(String(phone))) {
    return res.status(400).json({ error: "رقم الهاتف غير صالح" });
  }
  if (username && !/^[a-zA-Z0-9_\-\.]{3,30}$/.test(String(username))) {
    return res.status(400).json({ error: "اسم المستخدم غير صالح" });
  }
  next();
}

export function validateUpdate(req, res, next) {
  const { phone, active } = req.body || {};
  if (phone && !/^[\d+()\-\s]{6,20}$/.test(String(phone))) {
    return res.status(400).json({ error: "رقم الهاتف غير صالح" });
  }
  if (active !== undefined && typeof active !== "boolean") {
    return res.status(400).json({ error: "حقل active يجب أن يكون true/false" });
  }
  next();
}
