import * as repo from "./customers.repo.js";
import { generateCustomerSku } from "./sku.util.js";
import * as distributorsRepo from "../distributors/distributors.repo.js";

function isAdmin(user) {
  return user && user.role === "admin";
}

function isDistributor(user) {
  return !!(
    user &&
    (user.role === "distributor" || user.distributor_id != null)
  );
}

async function assertDistributorActive(distributor_id) {
  if (distributor_id == null) return;
  const d = await distributorsRepo.getDistributorById(distributor_id);
  if (!d) {
    const err = new Error("الموزّع غير موجود");
    err.status = 400;
    throw err;
  }
  if (!d.active) {
    const err = new Error("الموزّع غير نشط");
    err.status = 400;
    throw err;
  }
}

function assertLatLng(lat, lng) {
  if (lat != null && (lat < -90 || lat > 90)) {
    const err = new Error("قيمة latitude غير صحيحة");
    err.status = 400;
    throw err;
  }
  if (lng != null && (lng < -180 || lng > 180)) {
    const err = new Error("قيمة longitude غير صحيحة");
    err.status = 400;
    throw err;
  }
}

// قائمة العملاء
export function list(opts = {}, currentUser) {
  if (currentUser?.role === "distributor" && currentUser?.distributor_id) {
    return repo.list({
      ...opts,
      distributor_id: Number(currentUser.distributor_id),
    });
  }
  return repo.list(opts);
}

// إنشاء عميل مع توليد SKU إن لم يزود
export async function create(dto = {}, currentUser) {
  if (!currentUser) {
    const err = new Error("غير مصرح");
    err.status = 401;
    throw err;
  }

  const name = String(dto.name || "").trim();
  if (!name)
    throw Object.assign(new Error("اسم العميل مطلوب"), { status: 400 });

  let customer_sku = String(dto.customer_sku || "").trim();
  if (!customer_sku) {
    customer_sku = await generateCustomerSku();
  }

  let distributor_id = null;
  if (isDistributor(currentUser)) {
    // الموزّع لا يحدّد موزّعًا آخر—يثبّت نفسه
    const fromUser = currentUser.distributor_id ?? null;
    if (fromUser == null) {
      const err = new Error(
        "هذا الحساب موزّع لكنه غير مرتبط بأي موزّع. الرجاء ربط المستخدم بموزّع."
      );
      err.status = 400;
      throw err;
    }
    distributor_id = Number(fromUser);
  } else if (isAdmin(currentUser)) {
    // للأدمن: إن أرسل distributor_id تحقّق منه
    distributor_id =
      dto.distributor_id != null && dto.distributor_id !== ""
        ? Number(dto.distributor_id)
        : null;
    await assertDistributorActive(distributor_id);
  } else {
    const err = new Error("صلاحيات غير كافية");
    err.status = 403;
    throw err;
  }

  // تحقق الإحداثيات
  const lat =
    dto.latitude === "" || dto.latitude == null ? null : Number(dto.latitude);
  const lng =
    dto.longitude === "" || dto.longitude == null
      ? null
      : Number(dto.longitude);
  assertLatLng(lat, lng);

  const toInsert = {
    name,
    customer_sku,
    phone: dto.phone ? String(dto.phone) : null,
    address: dto.address ? String(dto.address) : null,
    notes: dto.notes ? String(dto.notes) : null,
    distributor_id,
    latitude: lat,
    longitude: lng,
    active: typeof dto.active === "boolean" ? dto.active : true,
    created_at: new Date(),
  };
  return repo.create(toInsert);
}

// تحديث عميل
export async function update(id, dto = {}, currentUser) {
  if (!id) throw Object.assign(new Error("id مطلوب"), { status: 400 });
  if (!currentUser) {
    const err = new Error("غير مصرح");
    err.status = 401;
    throw err;
  }

  // منطق تغيير الموزّع حسب الدور
  let nextDistributorId = dto.distributor_id;
  if (isDistributor(currentUser)) {
    // الموزّع لا يستطيع نقل العميل لموزّع آخر
    if (
      nextDistributorId != null &&
      Number(nextDistributorId) !== Number(currentUser.distributor_id)
    ) {
      const err = new Error("لا يمكن للموزّع تغيير الموزّع المسؤول عن العميل");
      err.status = 403;
      throw err;
    }
    nextDistributorId = Number(currentUser.distributor_id); // إحكام
  } else if (isAdmin(currentUser)) {
    // للأدمن: يسمح بالتغيير (مع تحقق نشاط الموزّع)
    const safeId =
      nextDistributorId == null || nextDistributorId === ""
        ? null
        : Number(nextDistributorId);
    await assertDistributorActive(safeId);
    nextDistributorId = safeId;
  } else {
    const err = new Error("صلاحيات غير كافية");
    err.status = 403;
    throw err;
  }

  // تحقق الإحداثيات
  const lat =
    dto.latitude === "" || dto.latitude == null ? null : Number(dto.latitude);
  const lng =
    dto.longitude === "" || dto.longitude == null
      ? null
      : Number(dto.longitude);
  assertLatLng(lat, lng);
  const patch = {
    name: dto.name != null ? String(dto.name) : undefined,
    phone: dto.phone != null ? String(dto.phone) : undefined,
    address: dto.address != null ? String(dto.address) : undefined,
    notes: dto.notes != null ? String(dto.notes) : undefined,
    distributor_id: nextDistributorId,
    latitude: lat,
    longitude: lng,
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
