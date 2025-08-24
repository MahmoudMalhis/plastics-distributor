// client/src/features/orders/pages/CartEditor.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { imageUrl } from "../../products/api/products.api";
import { useCart, setQty, removeItem, clearCart } from "../state/cart.store";
import { createOrder } from "../api/orders.api";
import QuantityInput from "../../../components/ui/QuantityInput";
import PageHeader from "../../../components/ui/PageHeader";

export default function CartEditor() {
  const { items, totals } = useCart();
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const Title = ({ children }) => (
    <h2 className="text-[#0d141c] text-[28px] font-bold leading-tight px-4 text-center pb-3 pt-5">
      {children}
    </h2>
  );

  const canSubmit = useMemo(
    () => items.length > 0 && !submitting,
    [items, submitting]
  );

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      const res = await createOrder({ items, notes });
      const orderId = res?.id || res?.order?.id;
      clearCart();
      if (orderId) navigate(`/orders/${orderId}`, { replace: true });
      else navigate(`/orders`, { replace: true });
    } catch (e) {
      alert(e?.response?.data?.error || "تعذر إنشاء الطلب");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="relative min-h-screen bg-slate-50 overflow-x-hidden"
      style={{ fontFamily: '"Public Sans","Noto Sans",sans-serif' }}
    >
      <div className="max-w-5xl mx-auto py-5">
        <PageHeader title="الطلبيات"></PageHeader>

        {items.length === 0 ? (
          <div className="text-center text-[#49739c]">سلتك فارغة.</div>
        ) : (
          <form onSubmit={submit}>
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
                    const total =
                      Number(item.price || 0) * Number(item.qty || 0);
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
                            className="h-10 px-3 rounded-lg border border-[#cedbe8] bg-white"
                          >
                            حذف
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
                    className="flex-1 h-12 rounded-lg border border-[#cedbe8] bg-white"
                  >
                    إفراغ السلة
                  </button>
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="flex-1 h-12 rounded-lg bg-[#0d80f2] text-white font-bold disabled:opacity-60"
                  >
                    إرسال الطلب
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
