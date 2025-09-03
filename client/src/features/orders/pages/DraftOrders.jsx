// client/src/features/orders/pages/DraftOrders.jsx
import { useEffect, useState } from "react";
import {
  listDraftOrders,
  deleteOrder,
  updateOrderStatus,
} from "../api/orders.api";
import PageHeader from "../../../components/ui/PageHeader";
import { Link, useNavigate } from "react-router-dom";
import { dialog, notify } from "../../../utils/alerts";

export default function DraftOrders() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    try {
      const { rows } = await listDraftOrders({});
      setRows(rows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const onSubmitDraft = async (id) => {
    const ok = await dialog({
      title: "تأكيد الطلبية",
      text: "هل أنت متأكد من أنك تريد تأكيد الطلبية؟",
      icon: "warning",
      confirmText: "تأكيد",
      cancelText: "إلغاء",
    });
    if (!ok) return;
    await updateOrderStatus(id, "submitted");
    notify("success", "تم الإرسال");
    load();
  };

  const onDeleteDraft = async (id) => {
    const ok = await dialog({
      title: "تأكيد حذف الطلبية",
      text: "هل أنت متأكد من أنك تريد حذف الطلبية؟",
      icon: "warning",
      confirmText: "حذف",
      cancelText: "إلغاء",
    });
    if (!ok) return;
    await deleteOrder(id);
    notify("success", "تم الحذف");
    load();
  };

  return (
    <>
      <PageHeader title="مسوداتي">
        <button
          onClick={() => navigate("/distributor/catalog")}
          className="inline-flex items-center justify-center bg-blue-600 text-white font-semibold h-11 px-4 rounded-lg shadow hover:bg-blue-700 cursor-pointer"
        >
          <span className="material-icons">keyboard_backspace</span>
        </button>
      </PageHeader>
      <div className="bg-white border border-[#cedbe8] rounded-xl overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-100 text-[#49739c]">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">العميل</th>
              <th className="p-3">التاريخ</th>
              <th className="p-3">الإجمالي</th>
              <th className="p-3">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-[#49739c]">
                  جارٍ التحميل...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-[#49739c]">
                  لا توجد مسودات
                </td>
              </tr>
            ) : (
              rows.map((o) => (
                <tr key={o.id} className="border-t border-[#eef3f7]">
                  <td className="p-3">{o.id}</td>
                  <td className="p-3">{o.customer_name}</td>
                  <td className="p-3">
                    {new Date(o.created_at).toLocaleString("ar-EG")}
                  </td>
                  <td className="p-3">
                    {Number(o.total || 0).toLocaleString()} ₪
                  </td>
                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => onSubmitDraft(o.id)}
                      className="inline-flex items-center justify-center transition shadow-sm cursor-pointer rounded-full bg-green-100 text-green-600 hover:bg-green-200 w-9 h-9 text-[20px]"
                    >
                      <span className="material-icons">send</span>
                    </button>
                    <button
                      onClick={() => onDeleteDraft(o.id)}
                      className="inline-flex items-center justify-center transition shadow-sm cursor-pointer rounded-full bg-red-100 text-red-600 hover:bg-red-200 w-9 h-9 text-[20px]"
                    >
                      <span className="material-icons">delete</span>
                    </button>
                    <Link
                      to={`/orders/${o.id}`}
                      className="inline-flex items-center justify-center transition shadow-sm cursor-pointer rounded-full bg-yellow-100 text-yellow-600 hover:bg-yellow-200 w-9 h-9 text-[20px]"
                    >
                      <span className="material-icons">info</span>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
