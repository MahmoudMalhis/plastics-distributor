import MyDropzone from "./MyDropzone";

/**
 * Drag‑and‑drop image upload component. It provides a dashed drop zone with
 * a file chooser button and optional preview. A new optional prop
 * `hidePreview` allows consumers to suppress the built‑in preview (e.g. when
 * using a custom preview elsewhere). When `hidePreview` is true, the preview
 * block will not be rendered.
 */
export default function ImageUpload({
  file,
  onFileChange,
  hidePreview = false,
}) {
  return (
    <>
      <MyDropzone onFileChange={onFileChange} />

      {/* عرض المعاينة إذا لم يتم طلب إخفائها */}
      {file && !hidePreview && (
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
