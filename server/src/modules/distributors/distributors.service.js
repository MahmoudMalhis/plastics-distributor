import * as repo from "./distributors.repo.js";
import bcrypt from "bcrypt";
import { io } from "../../server.js";
import { randomPassword, randomToken } from "../../utils/password.js";
import { buildWaText } from "../../utils/wa.js";

// قائمة الموردين
export function list({ search } = {}) {
  return repo.search({ search });
}

// إنشاء مورد + مستخدم له
export async function create({ name, phone, address, notes, username }) {
  if (!name) throw Object.assign(new Error("الاسم مطلوب"), { status: 400 });

  // 1) أنشئ المورد
  const distributor = await repo.createDistributor({
    name,
    phone,
    address,
    notes,
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
export async function update(id, { name, phone, address, notes, active }) {
  const distributor = await repo.getDistributorById(id);
  if (!distributor)
    throw Object.assign(new Error("الموزع غير موجود"), { status: 404 });

  const updated = await repo.updateDistributor(id, {
    name,
    phone,
    address,
    notes,
    active,
  });

  // لو تم إيقافه → احذف refresh tokens + بث Socket.IO للمستخدمين
  if (typeof active === "boolean" && active === false) {
    const userIds = await repo.getUserIdsByDistributor(id);
    if (userIds.length) {
      await repo.revokeRefreshTokensForUsers(userIds);
      // بث رسالة فصل
      userIds.forEach((uid) => {
        io.to(`user:${uid}`).emit("account_disabled", {
          reason: "distributor_disabled",
        });
      });
    }
  }

  return updated;
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
