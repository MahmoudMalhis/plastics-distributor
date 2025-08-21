// يولّد SKU على شكل PRD-000001 بالاعتماد على أعلى رقم موجود حالياً
export async function generateProductSku(
  db,
  { prefix = "PRD-", pad = 6 } = {}
) {
  // نجلب كل الـSKU التي تبدأ بالبادئة ثم نأخذ أعلى رقم منها (بشكل آمن وبسيط)
  const rows = await db("products")
    .select("sku")
    .where("sku", "like", `${prefix}%`);

  let maxNum = 0;
  for (const r of rows) {
    const s = String(r.sku || "");
    if (s.startsWith(prefix)) {
      const n = parseInt(s.slice(prefix.length), 10);
      if (!Number.isNaN(n) && n > maxNum) maxNum = n;
    }
  }

  const next = maxNum + 1;
  return `${prefix}${String(next).padStart(pad, "0")}`;
}
