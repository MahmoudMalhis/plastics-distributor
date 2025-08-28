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

export async function getDistributor(id) {
  const response = await api.get(`/api/distributors/${id}`);
  return response.data;
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
  const response = await api.post(
    "/api/distributors",
    cleanObject({
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
    })
  );
  return response.data; // { distributors, user, tempPassword }
}

/** تعديل بيانات مورد (يدعم التفعيل/الإيقاف عبر active) */
export async function updateDistributor(
  distributorsId,
  {
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
    active,
  } = {}
) {
  const response = await api.patch(
    `/api/distributors/${distributorsId}`,
    cleanObject({
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
      active,
    })
  );
  return response.data;
}

export async function uploadDistributorIdImage(distributorId, file) {
  const formData = new FormData();
  formData.append("image", file);
  const response = await api.post(
    `/api/distributors/${distributorId}/id-image`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data; // { id_image_url }
}

/** توليد توكن لمرة واحدة لتعيين كلمة المرور */
export async function issuePasswordToken(distributorsId) {
  const response = await api.post(
    `/api/distributors/${distributorsId}/password-token`
  );
  return response.data; // { userId, token, setUrl, waText, expiresAt }
}

export async function listActiveDistributors({ q } = {}) {
  const params = new URLSearchParams();
  params.set("active", "true");
  if (q) params.set("search", q);
  const res = await api.get(`/api/distributors?${params.toString()}`);
  return res.data;
}
