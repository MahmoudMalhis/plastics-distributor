import IconButton from "../../../components/ui/IconButton";
import ConfirmAction from "../../../components/ui/ConfirmAction";

export default function DistributorRow({
  index,
  distributor,
  onSendPasswordLink,
  onToggleActive,
}) {
  const isActive = distributor?.active !== false;
  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="py-3 px-4 sm:px-6">{index + 1}</td>
      <td className="py-3 px-4 sm:px-6 font-semibold">{distributor.name}</td>
      <td className="py-3 px-4 sm:px-6">{distributor.phone}</td>
      <td className="py-3 px-4 sm:px-6">{distributor.address}</td>
      <td className="py-3 px-4 sm:px-6">{distributor.notes}</td>
      <td className="py-3 px-4 sm:px-6">{distributor.username}</td>
      <td className="py-3 px-4 sm:px-6">
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <ConfirmAction
            icon={isActive ? "block" : "check_circle"}
            variant={isActive ? "warning" : "success"}
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
            icon="send"
            title="إرسال رابط تعيين كلمة المرور عبر واتساب"
            onClick={onSendPasswordLink}
            className="text-green-700 hover:text-green-800 bg-green-200 hover:bg-green-300"
          />
        </div>
      </td>
    </tr>
  );
}
