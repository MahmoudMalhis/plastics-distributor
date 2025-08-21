export default function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden"
        dir="rtl"
      >
        <div className="px-4 sm:px-5 py-3 border-b flex items-center justify-between bg-white">
          <h3 className="text-lg sm:text-xl font-bold">{title}</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center cursor-pointer"
            type="button"
          >
            <span className="material-icons">close</span>
          </button>
        </div>
        <div className="px-4 sm:px-5 py-4">{children}</div>
        {footer && (
          <div className="px-4 sm:px-5 py-3 border-t flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
