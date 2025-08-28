import IconButton from "../../../components/ui/IconButton";
import ConfirmAction from "../../../components/ui/ConfirmAction";
import { Link } from "react-router-dom";

export default function DistributorRow({
  index,
  distributor,
  onEdit,
  onSendPasswordLink,
  onToggleActive,
}) {
  const isActive = distributor?.active !== false;
  const mustChangePassword =
    distributor?.must_change_password === true ||
    distributor?.must_change_password === 1;

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="py-3 px-4 sm:px-6">{index + 1}</td>
      <td className="w-1/5 py-3 px-4 sm:px-6 font-semibold">
        <Link
          to={`/admin/distributors/${distributor.id}`}
          className="hover:text-blue-600 hover:underline"
          title="عرض ملف الموزّع"
        >
          {distributor.name}
        </Link>
      </td>
      <td className="w-1/5 py-3 px-4 sm:px-6">{distributor.phone}</td>
      <td className="w-1/5 py-3 px-4 sm:px-6">{distributor.address}</td>
      <td className="w-1/5 py-3 px-4 sm:px-6">
        <div className="line-clamp-2">{distributor.notes}</div>
      </td>
      <td className="py-3 px-4 sm:px-6">{distributor.username}</td>
      <td className="w-1/5 py-3 px-4 sm:px-6">
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <ConfirmAction
            icon={isActive ? "toggle_off" : "toggle_on"}
            variant={isActive ? "success" : "danger"}
            title={isActive ? "إيقاف" : "تفعيل"}
            text={
              isActive
                ? "سيتم إيقاف حساب المورد وتسجيل خروجه من كل الجلسات."
                : "سيتم إعادة تفعيل حساب المورد."
            }
            confirmText={isActive ? "إيقاف" : "تفعيل"}
            onConfirm={onToggleActive}
          />
          <IconButton
            icon="edit"
            title="تعديل"
            onClick={onEdit}
            className="inline-flex items-center justify-center transition shadow-sm cursor-pointer
                                rounded-full bg-yellow-100 text-yellow-600 hover:bg-yellow-200
                                w-9 h-9 text-[20px]"
          />
          {mustChangePassword && (
            <IconButton
              icon="send"
              title="إرسال رابط تعيين كلمة المرور عبر واتساب"
              onClick={onSendPasswordLink}
              className="text-green-700 hover:text-green-800 bg-green-200 hover:bg-green-300"
            />
          )}
        </div>
      </td>
    </tr>
  );
}
