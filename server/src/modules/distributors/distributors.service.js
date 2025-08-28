import * as repo from "./distributors.repo.js";
import bcrypt from "bcrypt";
import { io } from "../../server.js";
import { randomPassword, randomToken } from "../../utils/password.js";
import { buildWaText } from "../../utils/wa.js";

// قائمة الموردين
export async function list({ search } = {}) {
  const rows = await repo.search({ search });
  return rows.map((r) => ({
    ...r,
    active: !!r.active,
    company_vehicle: r.company_vehicle == null ? null : !!r.company_vehicle,
    must_change_password: r.must_change_password,
    username: r.username,
  }));
}

// إنشاء مورد + مستخدم له
export async function create({
  name,
  phone,
  phone2,
  address,
  notes,
  username,
  id_image_url,
  vehicle_plate,
  vehicle_type,
  vehicle_model,
  company_vehicle,
  responsible_areas,
}) {
  if (!name) throw Object.assign(new Error("الاسم مطلوب"), { status: 400 });

  // 1) أنشئ المورد
  const distributor = await repo.createDistributor({
    name,
    phone,
    phone2,
    address,
    notes,
    username,
    id_image_url,
    vehicle_plate,
    vehicle_type,
    vehicle_model,
    company_vehicle,
    responsible_areas,
  });
  // 2) جهّز حساب المستخدم للمورد
  //   - username إن لم يُمرر نولّد واحد بسيط من الاسم
  let finalUsername = (
    username || String(name).trim().toLowerCase().replace(/\s+/g, "_")
  ).slice(0, 30);
  finalUsername = await repo.ensureUniqueUsername(finalUsername);

  const tempPwd = randomPassword(10);
  const hash = await bcrypt.hash(tempPwd, 10);

  const user = await repo.createUser({
    username: finalUsername,
    password_hash: hash,
    role: "distributor",
    distributor_id: distributor.id,
    must_change_password: true,
    active: true,
  });

  // نعيد كلمة المرور المؤقتة مرة واحدة فقط في الاستجابة
  return {
    distributor,
    user: { id: user.id, username: user.username },
    tempPassword: tempPwd,
  };
}

// تعديل/إيقاف/إعادة تفعيل مورد
export async function update(
  id,
  {
    name,
    phone,
    phone2,
    address,
    notes,
    id_image_url,
    vehicle_plate,
    vehicle_type,
    vehicle_model,
    company_vehicle,
    responsible_areas,
    active,
  }
) {
  const distributor = await repo.getDistributorById(id);
  if (!distributor)
    throw Object.assign(new Error("الموزع غير موجود"), { status: 404 });

  // حدّث بيانات الموزع في قاعدة البيانات
  const updated = await repo.updateDistributor(id, {
    name,
    phone,
    phone2,
    address,
    notes,
    id_image_url,
    vehicle_plate,
    vehicle_type,
    vehicle_model,
    company_vehicle,
    responsible_areas,
    active,
  });

  // حوّل قيمة active إلى Boolean حقيقي أياً كان نوعها
  let activeParsed;
  if (active !== undefined && active !== null) {
    if (typeof active === "boolean") activeParsed = active;
    else if (typeof active === "number") activeParsed = active !== 0;
    else if (typeof active === "string")
      activeParsed = active === "1" || active.toLowerCase() === "true";
    else activeParsed = !!active;
  }

  // عند التعطيل
  if (activeParsed === false) {
    const userIds = await repo.getUserIdsByDistributor(id);
    if (userIds.length) {
      await repo.revokeRefreshTokensForUsers(userIds);
      await repo.setUsersActiveByDistributor(id, false);
      userIds.forEach((uid) => {
        io.to(`user:${uid}`).emit("account_disabled", {
          reason: "distributor_disabled",
        });
      });
    }
  }

  // عند إعادة التفعيل
  if (activeParsed === true) {
    await repo.setUsersActiveByDistributor(id, true);
  }

  return { ...updated, active: !!updated.active };
}

// إنشاء توكن لمرة واحدة لتعيين كلمة المرور (للواتساب)
export async function issuePasswordToken(distributorId) {
  const user = await repo.getUserByDistributorId(distributorId);
  if (!user)
    throw Object.assign(new Error("لا يوجد مستخدم مرتبط بالموزع"), {
      status: 404,
    });

  // أنشئ توكن عشوائي قصير الأجل
  const { token, hash, expiresAt } = randomToken(60 * 60 * 24);

  const tokenRecord = await repo.insertPasswordSetToken({
    user_id: user.id,
    token_hash: hash,
    expires_at: expiresAt,
  });

  const setUrl = `${process.env.BASE_URL}/set-password?token=${token}`;
  const waText = buildWaText({ name: user.username, url: setUrl });

  return { userId: user.id, token, setUrl, waText, expiresAt, tokenRecord };
}

// رفع صورة الهوية
export async function uploadIdImage(distributorId, filePath) {
  const distributor = await repo.getDistributorById(distributorId);
  if (!distributor)
    throw Object.assign(new Error("الموزع غير موجود"), { status: 404 });
  const relativePath = filePath.replace(/^.*[\\/]uploads[\\/]/, "/uploads/");
  const updated = await repo.updateDistributor(distributorId, {
    id_image_url: relativePath,
  });
  return { id_image_url: relativePath, distributor: updated };
}

// جلب موزع واحد مع معلومات المستخدم
export async function getById(id) {
  const distributor = await repo.getDistributorById(id);
  if (!distributor) return null;
  const user = await repo.getUserByDistributorId(id);
  return {
    ...distributor,
    active: !!distributor.active,
    company_vehicle:
      distributor.company_vehicle == null
        ? null
        : !!distributor.company_vehicle,
    username: user?.username,
    must_change_password: user?.must_change_password,
  };
}

export async function getOne(id) {
  const distributor = await repo.getDistributorById(id);
  if (!distributor) return null;
  return {
    ...distributor,
    active: !!distributor.active,
    company_vehicle:
      distributor.company_vehicle == null
        ? null
        : !!distributor.company_vehicle,
  };
}
