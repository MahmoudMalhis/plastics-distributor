import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { imageUrl } from "../../products/api/products.api";
import { createCustomer } from "../../customers/api/customers.api";
import {
  useCart,
  setQty,
  removeItem,
  clearCustomer,
  clearCart,
  setCustomer,
} from "../state/cart.store";
import { createOrder, listMyOrders } from "../api/orders.api";
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

  // إنشاء عميل سريع
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });
  const [custError, setCustError] = useState("");
  const [custSaving, setCustSaving] = useState(false);

  // الدفع
  const [paymentMethod, setPaymentMethod] = useState("cash"); // cash | installments | cheque
  const [installmentAmount, setInstallmentAmount] = useState("");
  const [installmentPeriod, setInstallmentPeriod] = useState("weekly"); // weekly | monthly
  const [chequeNote, setChequeNote] = useState("");
  const [firstPayment, setFirstPayment] = useState("");
  const [draftOrders, setDraftOrders] = useState([]);

  const canSubmit = useMemo(() => {
    if (items.length === 0) return false;
    if (!customer?.id) return false;
    if (submitting) return false;

    if (paymentMethod === "installments") {
      const amt = Number(installmentAmount);
      if (!Number.isFinite(amt) || amt <= 0) return false;
      if (!["weekly", "monthly"].includes(installmentPeriod)) return false;
    }
    return true;
  }, [
    items,
    customer,
    submitting,
    paymentMethod,
    installmentAmount,
    installmentPeriod,
  ]);

  useEffect(() => {
    async function fetchDraftOrders() {
      const drafts = await listMyOrders({ status: "draft" });
      setDraftOrders(drafts.rows || []);
    }
    fetchDraftOrders();
  }, []);

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

      // احصل على distributor_id من المستخدم الحالي أو من مكان آخر
      // مثلاً من localStorage أو من context
      const distributorId =
        localStorage.getItem("distributor_id") ||
        sessionStorage.getItem("distributor_id") ||
        1; // قيمة افتراضية مؤقتة

      const res = await createOrder({
        items, // [{ productId, qty }]
        notes,
        customer_id: customer?.id,
        status: "submitted",
        distributor_id: Number(distributorId), // أضف هذا السطر
        payment_method: paymentMethod,
        installment_amount:
          paymentMethod === "installments"
            ? Number(installmentAmount)
            : undefined,
        installment_period:
          paymentMethod === "installments" ? installmentPeriod : undefined,
        check_note: paymentMethod === "cheque" ? chequeNote : undefined,
        first_payment: Number(firstPayment) || undefined,
      });

      const orderId = res?.id || res?.order?.id;
      clearCart();
      clearCustomer();
      if (orderId) navigate(`/orders/${orderId}`, { replace: true });
      else navigate(`/distributor/orders`, { replace: true });
    } catch (error) {
      notify("error", "تعذر إرسال الطلب");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const saveDraft = async () => {
    if (items.length === 0) {
      notify("warning", "السلة فارغة");
      return;
    }
    try {
      setSubmitting(true);
      await createOrder({
        items,
        notes,
        customer_id: customer?.id || null,
        status: "draft", // ←←
        payment_method: paymentMethod,
        installment_amount:
          paymentMethod === "installments"
            ? Number(installmentAmount)
            : undefined,
        installment_period:
          paymentMethod === "installments" ? installmentPeriod : undefined,
        check_note: paymentMethod === "cheque" ? chequeNote : undefined,
        first_payment: Number(firstPayment) || undefined,
      });
      // فضّي السلة + امسح العميل المختار
      clearCart();
      setCustomer(null); // ←← إزالة اسم العميل من الإختيار في الكاتالوج
      notify("success", "تم الحفظ كمسودة");
      navigate("/distributor/orders/drafts", { replace: true });
    } catch (e) {
      notify("error", e?.message || "تعذر حفظ المسودة");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title={`طلبيات العميل: ${customer?.name || ""}`}>
        {draftOrders.length > 0 && (
          <button
            onClick={() => navigate("/distributor/orders/drafts")}
            className="inline-flex items-center justify-center bg-gray-600 text-gray-100 font-semibold h-11 px-4 rounded-lg shadow hover:bg-blue-700 cursor-pointer"
          >
            <span className="material-icons">drafts</span>
          </button>
        )}
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
        <form
          onSubmit={submit}
          dir="rtl"
          className="flex max-sm:flex-col gap-4"
        >
          {/* لوحة ملخص الدفع (يسار التصميم) */}
          <aside className="col-span-4 md:flex-2/5 lg:flex-1/3 2xl:flex-1/4">
            <div className="bg-white border border-[#cedbe8] rounded-2xl p-5 shadow-sm sticky top-4">
              <h3 className="text-lg font-extrabold mb-4">ملخص الدفع</h3>

              {/* تبويبات طريقة الدفع */}
              <div className="mb-4">
                <div className="text-sm text-[#49739c] mb-2">طريقة الدفع</div>
                <div className="grid xl:grid-cols-3 lg:grid-cols-2 md:grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={
                      "h-10 rounded-xl border cursor-pointer " +
                      (paymentMethod === "cash"
                        ? "bg-[#2f6fed] text-white border-[#2f6fed]"
                        : "bg-white text-[#0d141c] border-[#cedbe8] hover:bg-slate-50")
                    }
                  >
                    نقدًا
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("installments")}
                    className={
                      "h-10 rounded-xl border cursor-pointer " +
                      (paymentMethod === "installments"
                        ? "bg-[#2f6fed] text-white border-[#2f6fed]"
                        : "bg-white text-[#0d141c] border-[#cedbe8] hover:bg-slate-50")
                    }
                  >
                    تقسيط
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cheque")}
                    className={
                      "h-10 rounded-xl border cursor-pointer " +
                      (paymentMethod === "cheque"
                        ? "bg-[#2f6fed] text-white border-[#2f6fed]"
                        : "bg-white text-[#0d141c] border-[#cedbe8] hover:bg-slate-50")
                    }
                  >
                    شيكات
                  </button>
                </div>
              </div>

              {/* حقول خاصة بكل طريقة */}
              {paymentMethod === "installments" && (
                <div className="grid grid-cols-6 gap-3 mb-4">
                  <label className="block col-span-2">
                    <div className="text-sm text-[#49739c] mb-1">
                      فترة الدفع
                    </div>
                    <select
                      value={installmentPeriod}
                      onChange={(e) => setInstallmentPeriod(e.target.value)}
                      className="w-full h-11 border border-[#cedbe8] rounded-xl bg-white px-3"
                    >
                      <option value="weekly">أسبوعية</option>
                      <option value="monthly">شهرية</option>
                    </select>
                  </label>
                  <label className="block col-span-2">
                    <div className="text-sm text-[#49739c] mb-1">
                      قيمة الدفعة
                    </div>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={installmentAmount}
                      onChange={(e) => setInstallmentAmount(e.target.value)}
                      className="w-full h-11 border border-[#cedbe8] rounded-xl bg-white px-3"
                      placeholder="0.00"
                    />
                  </label>
                  <label className="block col-span-2">
                    <div className="text-sm text-[#49739c] mb-1">
                      الدفعة الأولى
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={firstPayment}
                      onChange={(e) => setFirstPayment(e.target.value)}
                      className="w-full h-11 border border-[#cedbe8] rounded-xl bg-white px-3"
                      placeholder="0.00"
                    />
                  </label>
                </div>
              )}

              {paymentMethod === "cheque" && (
                <div className="mb-4">
                  <label className="block">
                    <div className="text-sm text-[#49739c] mb-1">
                      ملاحظة الشيك
                    </div>
                    <input
                      type="text"
                      maxLength={255}
                      value={chequeNote}
                      onChange={(e) => setChequeNote(e.target.value)}
                      className="w-full mb-4 h-11 border border-[#cedbe8] rounded-xl bg-white px-3"
                    />
                  </label>
                  <label className="block mb-3">
                    <div className="text-sm text-[#49739c] mb-1">
                      الدفعة الأولى
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={firstPayment}
                      onChange={(e) => setFirstPayment(e.target.value)}
                      className="w-full h-11 border border-[#cedbe8] rounded-xl bg-white px-3"
                      placeholder="0.00"
                    />
                  </label>
                </div>
              )}

              {/* إحصائيات صغيرة */}
              <div className="flex items-center justify-between mt-2">
                <div className="text-[#49739c]">عدد القطع</div>
                <div className="text-[#0d141c] font-bold">{totals.count}</div>
              </div>
              <div className="flex items-center justify-between mt-1">
                <div className="text-[#49739c]">الإجمالي</div>
                <div className="text-[#0d141c] font-extrabold">
                  ₪ {totals.subtotal.toLocaleString()}
                </div>
              </div>

              {/* أزرار */}
              <div className="flex flex-col gap-2 mt-4">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={
                    "h-12 rounded-xl font-bold cursor-pointer " +
                    (canSubmit
                      ? "bg-[#2f6fed] text-white hover:brightness-110"
                      : "bg-[#2f6fed]/60 text-white cursor-not-allowed")
                  }
                >
                  إرسال الطلب
                </button>
                <button
                  type="button"
                  onClick={saveDraft}
                  disabled={submitting || items.length === 0 || !customer?.id}
                  className="h-12 rounded-xl font-bold border border-[#cedbe8] bg-white hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
                >
                  حفظ كمسودة
                </button>
                <button
                  type="button"
                  onClick={() => clearCart()}
                  className="h-12 rounded-xl font-bold border border-[#cedbe8] bg-slate-50 hover:bg-white cursor-pointer"
                >
                  إفراغ السلة
                </button>
              </div>
            </div>
          </aside>

          {/* جدول العناصر + الملاحظات (يمين التصميم) */}
          <section className="lg:col-span-8 flex flex-col gap-4 md:flex-3/5 lg:flex-2/3 2xl:flex-3/4">
            {/* اسم العميل الصغير أعلى الجدول */}

            {/* الجدول */}
            <div className="bg-white border border-[#cedbe8] rounded-2xl overflow-hidden">
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
                <tbody className="text-[#0d141c]">
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
                          ₪ {Number(item.price).toLocaleString()}
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
                        <td className="p-3">₪ {total.toLocaleString()}</td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => removeItem(item.productId)}
                            className="inline-flex items-center justify-center transition shadow-sm cursor-pointer rounded-full bg-red-100 text-red-600 hover:bg-red-200 w-9 h-9 text-[20px]"
                            title="إزالة من السلة"
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

            {/* الملاحظات */}
            <div className="bg-white border border-[#cedbe8] rounded-2xl p-4">
              <div className="text-[#0d141c] font-bold mb-2">ملاحظات</div>
              <textarea
                dir="rtl"
                rows={6}
                className="w-full border border-[#cedbe8] rounded-xl bg-white p-3"
                placeholder="اكتب أي ملاحظات خاصة بالطلب..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </section>

          {/* modal إنشاء عميل */}
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
