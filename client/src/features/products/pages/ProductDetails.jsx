// client/src/features/products/pages/ProductDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  getProductById,
  searchProducts,
  imageUrl,
} from "../../products/api/products.api";
import { addItem } from "../../orders/state/cart.store";
import QuantityInput from "../../../components/ui/QuantityInput";
import PageHeader from "../../../components/ui/PageHeader";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [product, setProduct] = useState(null);

  const [rel, setRel] = useState([]);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const prod = await getProductById(id);
        if (cancelled) return;
        setProduct(prod || null);

        // منتجات مشابهة من نفس التصنيف (حد أعلى 8، استثناء المنتج الحالي)
        if (prod?.category_id) {
          const { rows } = await searchProducts({
            q: "",
            categoryId: prod.category_id,
            page: 1,
            pageSize: 8,
            sort: "latest",
          });
          if (!cancelled) {
            setRel((rows || []).filter((x) => x.id !== prod.id));
          }
        } else {
          setRel([]);
        }
      } catch (e) {
        if (!cancelled) {
          setErr(e?.response?.data?.error || "تعذر تحميل المنتج");
          setProduct(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const img = useMemo(
    () => (product?.image_url ? imageUrl(product.image_url) : null),
    [product?.image_url]
  );

  if (loading) {
    return (
      <div
        className="relative min-h-screen bg-slate-50 overflow-x-hidden"
        style={{ fontFamily: '"Public Sans","Noto Sans",sans-serif' }}
      >
        <div className="max-w-6xl mx-auto py-10 px-4">
          <div className="bg-white border border-[#cedbe8] rounded-2xl p-6 animate-pulse">
            <div className="h-6 w-48 bg-slate-200 rounded mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="aspect-[4/3] bg-slate-200 rounded-xl" />
              <div className="space-y-3">
                <div className="h-5 w-2/3 bg-slate-200 rounded" />
                <div className="h-4 w-1/2 bg-slate-200 rounded" />
                <div className="h-4 w-1/3 bg-slate-200 rounded" />
                <div className="h-10 w-40 bg-slate-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (err || !product) {
    return (
      <div
        className="relative min-h-screen bg-slate-50 overflow-x-hidden"
        style={{ fontFamily: '"Public Sans","Noto Sans",sans-serif' }}
      >
        <div className="max-w-6xl mx-auto py-10 px-4">
          <div className="bg-white border border-[#cedbe8] rounded-2xl p-6 text-center">
            <h3 className="text-xl font-bold mb-2">تعذر عرض المنتج</h3>
            <p className="text-[#49739c] text-sm mb-4">
              {err || "المنتج غير موجود"}
            </p>
            <button
              onClick={() => navigate(-1)}
              className="h-10 px-4 rounded-lg border border-[#cedbe8] bg-white"
            >
              العودة
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen bg-slate-50 overflow-x-hidden"
      style={{ fontFamily: '"Public Sans","Noto Sans",sans-serif' }}
    >
      <PageHeader title="تفاصيل المنتج">
        <Link
          to="/distributor/catalog"
          className="text-sm underline text-[#49739c]"
        >
          <span className="material-icons">keyboard_backspace</span>
        </Link>
      </PageHeader>

      <div className="max-w-6xl mx-auto py-5">
        <div className="bg-white border border-[#cedbe8] rounded-2xl p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* الصورة */}
            <div className="w-full">
              <div className="relative aspect-[4/3] bg-slate-100 rounded-xl overflow-hidden">
                {img ? (
                  <img
                    src={img}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-[#49739c] text-sm">
                    لا توجد صورة
                  </div>
                )}
              </div>
            </div>

            {/* التفاصيل */}
            <div className="flex flex-col gap-3">
              <h1 className="text-2xl font-bold text-[#0d141c] leading-tight">
                {product.name}
              </h1>

              <div className="text-sm text-[#49739c]">
                <span className="inline-block mr-2">
                  SKU: {product.sku || "—"}
                </span>
                {product.category_name && (
                  <span className="inline-block">
                    | التصنيف: {product.category_name}
                  </span>
                )}
              </div>

              {product.price != null && (
                <div className="text-xl font-semibold text-[#0d141c]">
                  {Number(product.price).toLocaleString()} ₪
                </div>
              )}

              <div className="flex gap-3 p-3 pt-0">
                <QuantityInput
                  value={qty}
                  onChange={setQty}
                  min={1}
                  className=""
                />
                <button
                  className="h-10 rounded-lg bg-[#0d80f2] text-white font-bold text-sm disabled:opacity-60 p-3 cursor-pointer"
                  onClick={() => addItem(product, qty)}
                >
                  <span className="material-icons">add_shopping_cart</span>
                </button>

                {product.description && (
                  <div className="text-[#0d141c] text-sm leading-relaxed">
                    {product.description}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* منتجات مشابهة */}
          {rel.length > 0 && (
            <>
              <h3 className="text-lg font-bold mt-6 mb-3 px-1">
                منتجات مشابهة
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {rel.map((rp) => (
                  <SimilarCard key={rp.id} product={rp} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SimilarCard({ product }) {
  const img = product.image_url ? imageUrl(product.image_url) : null;
  return (
    <Link
      to={`/distributor/products/${product.id}`}
      className="bg-white border border-[#cedbe8] rounded-xl overflow-hidden flex flex-col hover:shadow"
    >
      <div className="relative aspect-[4/3] bg-slate-100">
        {img ? (
          <img
            src={img}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-[#49739c] text-sm">
            لا توجد صورة
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="text-[#0d141c] font-bold leading-tight line-clamp-2">
          {product.name}
        </div>
        {product.price != null && (
          <div className="mt-1 text-sm font-semibold text-[#0d141c]">
            {Number(product.price).toLocaleString()} ₪
          </div>
        )}
      </div>
    </Link>
  );
}
