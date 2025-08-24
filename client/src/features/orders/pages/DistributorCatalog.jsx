// client/src/features/orders/pages/DistributorCatalog.jsx
import { useEffect, useMemo, useState } from "react";
import {
  searchProducts,
  listCategories,
  imageUrl,
} from "../../products/api/products.api";
import { addItem, useCart } from "../state/cart.store";
import QuantityInput from "../../../components/ui/QuantityInput";
import PageHeader from "../../../components/ui/PageHeader";
import { Link, useNavigate } from "react-router-dom";

export default function DistributorCatalog() {
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sort, setSort] = useState("latest");

  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [cats, setCats] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { items: item } = useCart();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listCategories();
        if (!cancelled) setCats(data?.rows || []);
      } catch (error) {
        console.error("Failed to load categories", error);
      }
    })();
    return () => (cancelled = true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(
      async () => {
        try {
          setLoading(true);
          setError("");
          const { rows, total } = await searchProducts({
            q,
            categoryId: categoryId || undefined,
            page,
            pageSize,
            sort,
          });
          if (!cancelled) {
            setItems(rows || []);
            setTotal(Number(total || 0));
          }
        } catch (e) {
          if (!cancelled)
            setError(e?.response?.data?.error || "تعذر تحميل المنتجات");
        } finally {
          if (!cancelled) setLoading(false);
        }
      },
      q ? 350 : 0
    );

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q, categoryId, page, pageSize, sort]);

  const pages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  return (
    <div
      className="relative min-h-screen bg-slate-50 overflow-x-hidden"
      style={{ fontFamily: '"Public Sans","Noto Sans",sans-serif' }}
    >
      <div className="max-w-6xl mx-auto py-5">
        <PageHeader title="كاتالوج المنتجات">
          <button
            className="relative inline-flex items-center justify-center bg-blue-600 text-white font-bold py-2.5 px-4 sm:px-5 rounded-lg shadow-md hover:bg-blue-700 transition cursor-pointer"
            onClick={() => navigate("/distributor/cart")}
          >
            <span className="material-icons text-base sm:text-[20px]">
              shopping_cart
            </span>
            <span className="absolute bg-red-500 rounded-full w-7 h-7 -top-2 -right-2">
              {item.length}
            </span>
          </button>
        </PageHeader>

        {/* شريط أدوات */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6">
          <div className="flex md:flex-row flex-col gap-3 px-4 mt-2">
            {/* البحث */}
            <label className="flex items-stretch rounded-lg col-span-2 basis-1/2">
              <div className="text-[#49739c] flex border border-[#cedbe8] bg-slate-50 items-center justify-center pr-[15px] rounded-r-lg border-l-0 px-2">
                {/* أيقونة بحث */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                >
                  <path d="M229.66,218.34l-50.91-50.91a88.11,88.11,0,1,0-11.31,11.31l50.91,50.91a8,8,0,0,0,11.31-11.31ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" />
                </svg>
              </div>
              <input
                dir="rtl"
                value={q}
                onChange={(e) => {
                  setPage(1);
                  setQ(e.target.value);
                }}
                placeholder="ابحث باسم المنتج أو الكود أو الوصف"
                className="flex w-full min-w-0 flex-1 rounded-lg text-[#0d141c] border border-[#cedbe8] bg-slate-50 h-12 placeholder:text-[#49739c] p-[12px] rounded-r-none border-r-0 pr-2 text-base focus:outline-none"
              />
            </label>

            {/* التصنيف */}
            <label className="flex items-stretch rounded-lg basis-1/4">
              <div className="text-[#49739c] flex border border-[#cedbe8] bg-slate-50 items-center justify-center pr-[15px] rounded-r-lg border-l-0 px-2">
                تصنيف
              </div>
              <select
                value={categoryId}
                onChange={(e) => {
                  setPage(1);
                  setCategoryId(e.target.value);
                }}
                className="flex w-full min-w-0 flex-1 rounded-lg text-[#0d141c] border border-[#cedbe8] bg-slate-50 h-12 p-[12px] rounded-r-none border-r-0 pr-2 text-base focus:outline-none"
              >
                <option value="">جميع التصنيفات</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            {/* الترتيب */}
            <label className="flex items-stretch rounded-lg">
              <div className="text-[#49739c] flex border border-[#cedbe8] bg-slate-50 items-center justify-center pr-[15px] rounded-r-lg border-l-0 px-2">
                ترتيب
              </div>
              <select
                value={sort}
                onChange={(e) => {
                  setPage(1);
                  setSort(e.target.value);
                }}
                className="flex w-full min-w-0 flex-1 rounded-lg text-[#0d141c] border border-[#cedbe8] bg-slate-50 h-12 p-[12px] rounded-r-none border-r-0 pr-2 text-base focus:outline-none"
              >
                <option value="latest">الأحدث</option>
                <option value="price_asc">السعر: من الأقل للأعلى</option>
                <option value="price_desc">السعر: من الأعلى للأقل</option>
                <option value="name">الاسم</option>
              </select>
            </label>
          </div>
        </div>

        {/* الشبكة */}
        <div className="mt-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-3 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <SkeletonGrid count={12} />
          ) : items.length === 0 ? (
            <div className="text-center text-[#49739c] py-10">
              لا توجد نتائج مطابقة
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {items.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={(qty) => addItem(product, qty)}
                />
              ))}
            </div>
          )}

          <Pager
            page={page}
            pages={pages}
            loading={loading}
            onPrev={() => setPage((n) => Math.max(1, n - 1))}
            onNext={() => setPage((n) => Math.min(pages, n + 1))}
          />
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, onAdd }) {
  const [qty, setQty] = useState(1);
  const img = product.image_url ? imageUrl(product.image_url) : null;
  return (
    <div className="bg-white border border-[#cedbe8] rounded-xl overflow-hidden flex flex-col shadow-xl">
      <div className="relative aspect-[4/3] bg-slate-100 h-48">
        <Link to={`/distributor/products/${product.id}`}>
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
        </Link>
      </div>
      <div className="p-3 flex-1 flex flex-col gap-1">
        <div className="text-[#0d141c] font-bold leading-tight line-clamp-2">
          {product.name}
        </div>
        <div className="text-xs text-[#49739c]">SKU: {product.sku || "—"}</div>
        {product.category_name && (
          <div className="text-xs text-[#49739c]">
            التصنيف: {product.category_name}
          </div>
        )}
        {product.price != null && (
          <div className="mt-1 text-sm font-semibold text-[#0d141c]">
            السعر: {Number(product.price).toLocaleString()} ₪
          </div>
        )}
      </div>
      <div className="flex justify-between p-3 pt-0">
        <QuantityInput value={qty} onChange={setQty} min={1} />
        <button
          className="h-10 rounded-lg bg-[#0d80f2] text-white font-bold text-sm disabled:opacity-60 p-3 cursor-pointer"
          onClick={() => onAdd(qty)}
        >
          <span className="material-icons">add_shopping_cart</span>
        </button>
      </div>
    </div>
  );
}

function SkeletonGrid({ count = 12 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-[#cedbe8] rounded-xl overflow-hidden animate-pulse"
        >
          <div className="aspect-[4/3] bg-slate-200" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-slate-200 rounded" />
            <div className="h-3 w-2/3 bg-slate-200 rounded" />
            <div className="h-3 w-1/3 bg-slate-200 rounded" />
          </div>
          <div className="p-3 pt-0">
            <div className="h-10 bg-slate-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Pager({ page, pages, loading, onPrev, onNext }) {
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={onPrev}
        disabled={page <= 1 || loading}
        className="h-10 px-3 rounded-lg border border-[#cedbe8] bg-white disabled:opacity-50"
      >
        السابق
      </button>
      <div className="text-sm text-[#49739c]">
        صفحة {page} من {pages}
      </div>
      <button
        onClick={onNext}
        disabled={page >= pages || loading}
        className="h-10 px-3 rounded-lg border border-[#cedbe8] bg-white disabled:opacity-50"
      >
        التالي
      </button>
    </div>
  );
}
