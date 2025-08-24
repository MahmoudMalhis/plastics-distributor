import { useDropzone } from "react-dropzone";

export default function MyDropzone({ onFileChange }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/png": [],
      "image/jpeg": [],
      "image/webp": [],
    },
    onDrop: (acceptedFiles) => {
      onFileChange?.(acceptedFiles[0]);
    },
  });

  return (
    <div
      {...getRootProps()}
      className={[
        "w-full min-h-32 rounded-xl border-2 border-dashed p-6",
        "flex flex-col items-center justify-center text-center gap-2",
        "cursor-pointer transition",
        isDragActive
          ? "border-blue-500 bg-blue-50"
          : "border-gray-300 hover:border-blue-400",
      ].join(" ")}
      dir="rtl"
    >
      {/* أيقونة السحابة */}
      <span className="material-icons !text-4xl text-gray-400">
        cloud_upload
      </span>

      {/* النص الرئيسي */}
      <p className="text-gray-700">
        اسحب وأفلت الصورة{" "}
        <span className="text-blue-600 underline underline-offset-2">هنا</span>{" "}
        أو انقر للاختيار
      </p>

      {/* النص الصغير */}
      <p className="text-[12px] text-gray-400">(PNG, JPG, WEBP)</p>

      {/* إدخال الملفات */}
      <input {...getInputProps()} />
    </div>
  );
}
