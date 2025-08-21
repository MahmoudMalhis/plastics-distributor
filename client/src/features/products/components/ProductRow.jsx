// src/features/products/components/ProductRow.jsx
import IconButton from "../../../components/ui/IconButton";
import ConfirmAction from "../../../components/ui/ConfirmAction";
import { currency, imageUrl } from "../../../utils/format";

export default function ProductRow({
  product,
  catMap,
  onEdit,
  onArchive,
  onRestore,
}) {
  const archived =
    !!product.archived_at || product.active === 0 || product.active === false;
  const imgSrc =
    product.thumb_url || product.image_url
      ? imageUrl(product.thumb_url || product.image_url)
      : null;

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="py-3 px-4 sm:px-6">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden border border-gray-200">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-500">
              لا صورة
            </div>
          )}
        </div>
      </td>

      <td className="py-3 px-4 sm:px-6 font-semibold">{product.name}</td>
      <td className="py-3 px-4 sm:px-6">{product.sku || "-"}</td>

      <td className="py-3 px-4 sm:px-6 whitespace-nowrap">
        {currency(product.price)}{" "}
        <span className="text-gray-500">/ {product.unit || "وحدة"}</span>
      </td>

      <td className="py-3 px-4 sm:px-6">
        {catMap[product.category_id] || product.category_id}
      </td>

      <td className="py-3 px-4 sm:px-6 text-center">
        {archived ? (
          <span className="bg-gray-200 text-gray-800 py-1 px-3 rounded-full text-xs">
            منتهي
          </span>
        ) : (
          <span className="bg-green-200 text-green-800 py-1 px-3 rounded-full text-xs">
            متوفر
          </span>
        )}
      </td>

      <td className="py-3 px-4 sm:px-6">
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <IconButton
            icon="edit"
            variant="primary"
            title="تعديل"
            onClick={onEdit}
          />
          {archived ? (
            <ConfirmAction
              icon="unarchive"
              variant="success"
              title="تأكيد الاسترجاع"
              text="سيعود المنتج للظهور في قائمة المنتجات."
              onConfirm={onRestore}
            />
          ) : (
            <ConfirmAction
              icon="archive"
              variant="danger"
              title="تأكيد الأرشفة"
              text="سيختفي المنتج عن المورّدين."
              onConfirm={onArchive}
            />
          )}
        </div>
      </td>
    </tr>
  );
}
