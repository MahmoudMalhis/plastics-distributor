import { api } from "../../../lib/api";

export async function listCustomers({ search, page = 1, limit = 20 } = {}) {
  const params = { search, page, limit };
  Object.keys(params).forEach(
    (k) => params[k] === undefined && delete params[k]
  );
  const { data } = await api.get("/api/customers", { params });
  if (Array.isArray(data)) return { rows: data, total: data.length };
  return {
    rows: data?.rows || data?.items || [],
    total: Number(data?.total ?? data?.count ?? 0),
  };
}

export async function createCustomer(dto) {
  const { data } = await api.post("/api/customers", dto);
  return data;
}

export async function updateCustomer(id, dto) {
  const { data } = await api.patch(`/api/customers/${id}`, dto);
  return data;
}

export async function getCustomer(id) {
  const { data } = await api.get(`/api/customers/${id}`);
  return data;
}
