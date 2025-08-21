// src/features/distributor/api/distributor.api.js
import { api } from "../../../lib/api";

// دالة مساعدة لتنظيف الكائن من الحقول الفارغة (undefined/null)
function cleanObject(object) {
  return Object.fromEntries(
    Object.entries(object || {}).filter(
      ([, value]) => value !== undefined && value !== null
    )
  );
}

/** جلب الموردين مع فلاتر اختيارية */
export async function listDistributor({ search, page, limit } = {}) {
  const params = cleanObject({ search, page, limit });
  const response = await api.get("/api/distributors", { params });
  const data = response.data;
  return Array.isArray(data) ? data : data.items || [];
}

/** إنشاء مورد جديد (يعيد كلمة مرور مؤقتة) */
export async function createDistributor({
  name,
  phone,
  address,
  notes,
  username,
}) {
  const response = await api.post(
    "/api/distributors",
    cleanObject({ name, phone, address, notes, username })
  );
  return response.data; // { distributors, user, tempPassword }
}

/** تعديل بيانات مورد (يدعم التفعيل/الإيقاف عبر active) */
export async function updateDistributor(
  distributorsId,
  { name, phone, address, notes, username, active } = {}
) {
  const response = await api.patch(
    `/api/distributors/${distributorsId}`,
    cleanObject({ name, phone, address, notes, username, active })
  );
  return response.data;
}

/** توليد توكن لمرة واحدة لتعيين كلمة المرور */
export async function issuePasswordToken(distributorsId) {
  const response = await api.post(
    `/api/distributors/${distributorsId}/password-token`
  );
  return response.data; // { userId, token, setUrl, waText, expiresAt }
}
