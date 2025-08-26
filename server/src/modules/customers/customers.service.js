import * as repo from "./customers.repo.js";
import { generateCustomerSku } from "./sku.util.js";

// قائمة العملاء
export function list(opts = {}) {
  return repo.list(opts);
}

// إنشاء عميل مع توليد SKU إن لم يزود
export async function create(dto = {}) {
  const name = String(dto.name || "").trim();
  if (!name)
    throw Object.assign(new Error("اسم العميل مطلوب"), { status: 400 });

  let customer_sku = String(dto.customer_sku || "").trim();
  if (!customer_sku) {
    customer_sku = await generateCustomerSku();
  }

  const toInsert = {
    name,
    customer_sku,
    phone: dto.phone ? String(dto.phone) : null,
    address: dto.address ? String(dto.address) : null,
    notes: dto.notes ? String(dto.notes) : null,
    active: typeof dto.active === "boolean" ? dto.active : true,
    created_at: new Date(),
  };
  return repo.create(toInsert);
}

// تحديث عميل
export async function update(id, dto = {}) {
  if (!id) throw Object.assign(new Error("id مطلوب"), { status: 400 });
  const patch = {
    name: dto.name != null ? String(dto.name) : undefined,
    phone: dto.phone != null ? String(dto.phone) : undefined,
    address: dto.address != null ? String(dto.address) : undefined,
    notes: dto.notes != null ? String(dto.notes) : undefined,
  };
  if (typeof dto.active === "boolean") {
    patch.active = dto.active;
  }
  Object.keys(patch).forEach((k) => patch[k] === undefined && delete patch[k]);
  return repo.update(id, patch);
}

// تفاصيل عميل
export function getDetails(id) {
  if (!id) throw Object.assign(new Error("id مطلوب"), { status: 400 });
  return repo.getDetails(id);
}
