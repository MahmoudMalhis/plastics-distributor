// client/src/features/payments/api/payments.api.js
import { api } from "../../../lib/api";

export async function createPaymentForCustomer(
  customerId,
  { amount, method, reference, note, received_at }
) {
  const { data } = await api.post(
    `/api/payments/customers/${customerId}/payments`,
    {
      amount,
      method,
      reference,
      note,
      received_at,
    }
  );
  return data;
}
