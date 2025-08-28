export function validateCreate(req, res, next) {
  const { name, phone, phone2, username, company_vehicle } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: "الاسم مطلوب" });
  }
  if (phone && !/^[\d+()\-\s]{6,20}$/.test(String(phone))) {
    return res.status(400).json({ error: "رقم الهاتف غير صالح" });
  }
  if (phone2 && !/^[\d+()\-\s]{6,20}$/.test(String(phone2))) {
    return res.status(400).json({ error: "رقم الهاتف الإضافي غير صالح" });
  }
  if (username && !/^[a-zA-Z0-9_\-\.]{3,30}$/.test(String(username))) {
    return res.status(400).json({ error: "اسم المستخدم غير صالح" });
  }
  if (
    company_vehicle !== undefined &&
    typeof company_vehicle !== "boolean" &&
    typeof company_vehicle !== "number" &&
    typeof company_vehicle !== "string"
  ) {
    return res
      .status(400)
      .json({ error: "حقل company_vehicle يجب أن يكون true/false" });
  }
  next();
}

export function validateUpdate(req, res, next) {
  const { phone, phone2, active, company_vehicle } = req.body || {};
  if (phone && !/^[\d+()\-\s]{6,20}$/.test(String(phone))) {
    return res.status(400).json({ error: "رقم الهاتف غير صالح" });
  }
  if (phone2 && !/^[\d+()\-\s]{6,20}$/.test(String(phone2))) {
    return res.status(400).json({ error: "رقم الهاتف الإضافي غير صالح" });
  }
  if (active !== undefined && typeof active !== "boolean") {
    return res.status(400).json({ error: "حقل active يجب أن يكون true/false" });
  }
  if (
    company_vehicle !== undefined &&
    typeof company_vehicle !== "boolean" &&
    typeof company_vehicle !== "number" &&
    typeof company_vehicle !== "string"
  ) {
    return res
      .status(400)
      .json({ error: "حقل company_vehicle يجب أن يكون true/false" });
  }
  next();
}
