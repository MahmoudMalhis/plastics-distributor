export default function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-5xl max-h-[90vh] bg-gray-50 rounded-xl shadow-xl overflow-y-scroll"
        dir="rtl"
      >
        <div className="p-4 md:p-8">
          {/* Header */}
          <header className="flex justify-between items-center pb-6 border-b border-gray-200 mb-8">
            <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-800 cursor-pointer"
              type="button"
            >
              <span className="material-icons text-2xl">close</span>
            </button>
          </header>
          <main>{children}</main>
          {/* Footer */}
          {footer && (
            <footer className="pt-8 mt-8 border-t border-gray-200 flex justify-end items-center gap-3">
              {footer}
            </footer>
          )}
        </div>
      </div>
    </div>
  );
}
