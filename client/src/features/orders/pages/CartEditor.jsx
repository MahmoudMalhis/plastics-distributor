// client/src/features/orders/pages/CartEditor.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { imageUrl } from "../../products/api/products.api";
import { createCustomer } from "../../customers/api/customers.api";
import {
  useCart,
  setQty,
  removeItem,
  clearCart,
  setCustomer,
} from "../state/cart.store";
import { createOrder } from "../api/orders.api";
import QuantityInput from "../../../components/ui/QuantityInput";
import PageHeader from "../../../components/ui/PageHeader";
import CustomerForm from "../../customers/components/CustomerForm";
import Modal from "../../../components/ui/Modal";
import { notify } from "../../../utils/alerts";

export default function CartEditor() {
  const { items, totals, customer } = useCart();
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });
  const [custError, setCustError] = useState("");
  const [custSaving, setCustSaving] = useState(false);

  const canSubmit = useMemo(
    () => items.length > 0 && !!customer?.id && !submitting,
    [items, customer, submitting]
  );

  async function handleCreateCustomer(e) {
    if (e) e.preventDefault();
    const name = (customerForm.name || "").trim();
    if (!name) {
      setCustError("الاسم مطلوب");
      return;
    }
    try {
      setCustSaving(true);
      const data = await createCustomer(customerForm);
      setCustomer(data);
      setShowCustomerModal(false);
    } catch (err) {
      setCustError(err?.response?.data?.error || "فشل إنشاء العميل");
    } finally {
      setCustSaving(false);
    }
  }

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      // تمرير customer_id إلى الخادم
      const res = await createOrder({
        items,
        notes,
        customer_id: customer?.id,
        customer_name: customer?.name,
      });
      const orderId = res?.id || res?.order?.id;
      clearCart();
      if (orderId)
        navigate(`/distributor/orders/${orderId}`, { replace: true });
      else navigate(`/distributor/orders`, { replace: true });
    } catch (e) {
      notify("error", "تعذر إرسال الطلب");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title="الطلبيات">
        <button
          onClick={() => navigate("/distributor/catalog")}
          className="inline-flex items-center justify-center bg-blue-600 text-white font-semibold h-11 px-4 rounded-lg shadow hover:bg-blue-700 cursor-pointer"
        >
          <span className="material-icons">keyboard_backspace</span>
        </button>
      </PageHeader>

      {items.length === 0 ? (
        <div className="text-center text-[#49739c]">سلتك فارغة.</div>
      ) : (
        <form onSubmit={submit}>
          <div className="mb-4">
            <div className="text-sm text-[#49739c]">
              {customer ? (
                <>
                  <span className="font-semibold text-[#0d141c]">العميل: </span>
                  {customer.name}
                </>
              ) : (
                "لم يتم اختيار عميل"
              )}
            </div>
          </div>
          <div className="bg-white border border-[#cedbe8] rounded-xl overflow-hidden">
            <table className="w-full text-right">
              <thead className="bg-slate-100 text-[#49739c]">
                <tr>
                  <th className="p-3">المنتج</th>
                  <th className="p-3">السعر</th>
                  <th className="p-3">الكمية</th>
                  <th className="p-3">الإجمالي</th>
                  <th className="p-3">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const total = Number(item.price || 0) * Number(item.qty || 0);
                  return (
                    <tr
                      key={item.productId}
                      className="border-t border-[#eef3f7]"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-12 bg-slate-100 rounded overflow-hidden">
                            {item.image ? (
                              <img
                                src={imageUrl(item.image)}
                                className="w-full h-full object-cover"
                                alt={item.name}
                              />
                            ) : null}
                          </div>
                          <div>
                            <div className="text-[#0d141c] font-semibold">
                              {item.name}
                            </div>
                            <div className="text-xs text-[#49739c]">
                              SKU: {item.sku || "—"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        {Number(item.price).toLocaleString()} ₪
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <QuantityInput
                            value={item.qty}
                            onChange={(v) => setQty(item.productId, v)}
                            min={1}
                          />
                        </div>
                      </td>
                      <td className="p-3">{total.toLocaleString()} ₪</td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
                          className="inline-flex items-center justify-center transition shadow-sm cursor-pointer
        rounded-full
        bg-red-100 text-red-600 hover:bg-red-200
        w-9 h-9 text-[20px]
        "
                        >
                          <span className="material-icons">delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            <div className="md:col-span-2">
              <label className="block mb-1 text-sm text-[#49739c]">
                ملاحظات
              </label>
              <textarea
                dir="rtl"
                rows={4}
                className="w-full border border-[#cedbe8] rounded-xl bg-white p-3"
                placeholder="اكتب أي ملاحظات خاصة بالطلب..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="bg-white border border-[#cedbe8] rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="text-[#49739c]">عدد القطع</div>
                <div className="text-[#0d141c] font-bold">{totals.count}</div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-[#49739c]">الإجمالي</div>
                <div className="text-[#0d141c] font-bold">
                  {totals.subtotal.toLocaleString()} ₪
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => clearCart()}
                  className="flex-1 h-12 rounded-lg border border-[#cedbe8] bg-white cursor-pointer"
                >
                  إفراغ السلة
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="flex-1 h-12 rounded-lg bg-[#0d80f2] text-white font-bold disabled:opacity-60 cursor-pointer"
                >
                  إرسال الطلب
                </button>
              </div>
            </div>
          </div>
          <Modal
            open={showCustomerModal}
            onClose={() => setShowCustomerModal(false)}
            title="إنشاء عميل جديد"
            footer={
              <>
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="px-4 h-11 rounded-lg border border-gray-300 hover:bg-gray-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleCreateCustomer}
                  disabled={custSaving}
                  className="inline-flex items-center gap-2 px-4 h-11 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-60 cursor-pointer"
                >
                  <span className="material-icons text-[18px]">
                    {custSaving ? "hourglass_top" : "save"}
                  </span>
                  {custSaving ? "جارٍ الحفظ..." : "حفظ"}
                </button>
              </>
            }
          >
            <form
              id="new-customer-form"
              onSubmit={handleCreateCustomer}
              className="space-y-4"
              dir="rtl"
            >
              <CustomerForm
                form={customerForm}
                setForm={setCustomerForm}
                error={custError}
              />
            </form>
          </Modal>
        </form>
      )}
    </>
  );
}
