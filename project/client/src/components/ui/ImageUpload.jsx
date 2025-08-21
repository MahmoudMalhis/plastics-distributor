export default function ImageUpload({ file, onFileChange }) {
  return (
    <>
      <label
        htmlFor="prod-image-input"
        className="w-full min-h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-4 cursor-pointer hover:border-blue-400 transition"
      >
        <div className="flex items-center gap-3">
          <span className="material-icons">image</span>
          <div>
            <div className="text-sm font-medium">اسحب وأفلت الصورة هنا</div>
            <div className="text-xs text-gray-500">
              أو انقر للاختيار (PNG, JPG, WEBP)
            </div>
          </div>
        </div>
        <input
          id="prod-image-input"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => onFileChange?.(e.target.files?.[0] || null)}
          className="hidden"
        />
        <button
          type="button"
          className="inline-flex items-center gap-2 px-3 h-10 rounded-lg bg-blue-600 text-white"
        >
          <span className="material-icons text-[18px]">upload</span>
          اختر ملفًا
        </button>
      </label>

      {/* معاينة */}
      {file && (
        <div className="mt-3">
          <img
            src={URL.createObjectURL(file)}
            alt="preview"
            className="w-28 h-28 object-cover rounded-md border"
          />
        </div>
      )}
    </>
  );
}
