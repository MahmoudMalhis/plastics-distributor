// client/src/app/router/Unauthorized.jsx
export default function Unauthorized() {
  return (
    <div className="min-h-screen grid place-items-center bg-slate-50">
      <div className="bg-white border border-[#cedbe8] rounded-xl p-6 text-center">
        <h2 className="text-xl font-bold mb-2">لا تملك صلاحية الوصول</h2>
        <p className="text-[#49739c] text-sm">سجّل الدخول بحساب مخوّل.</p>
      </div>
    </div>
  );
}
