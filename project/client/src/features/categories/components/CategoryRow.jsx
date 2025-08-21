// src/features/categories/components/CategoryRow.jsx
import IconButton from "../../../components/ui/IconButton";
import ConfirmAction from "../../../components/ui/ConfirmAction";

export default function CategoryRow({ index, category, onEdit, onDelete }) {
  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="py-3 px-4 sm:px-6">{index + 1}</td>
      <td className="py-3 px-4 sm:px-6 font-semibold">{category.name}</td>
      <td className="py-3 px-4 sm:px-6">
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <IconButton
            icon="edit"
            variant="primary"
            title="تعديل"
            onClick={onEdit}
          />
          <ConfirmAction
            icon="delete"
            variant="danger"
            title="هل أنت متأكد؟"
            text="سيتم حذف العنصر بشكل نهائي"
            onConfirm={onDelete}
          />
        </div>
      </td>
    </tr>
  );
}
