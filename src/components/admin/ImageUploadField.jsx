import { useRef, useState } from "react";
import { ImageOff, Crop, Trash2 } from "lucide-react";
import ImageCropperModal from "./ImageCropperModal";

// value: { url: string, blob: Blob|null }
//   url  — то, что показываем (существующее фото при редактировании ИЛИ
//          превью только что обрезанного файла)
//   blob — заполняется только если пользователь выбрал/обрезал новый файл;
//          именно blob уходит в Cloudinary при сохранении формы. Если
//          blob пустой, а url есть — значит фото не менялось.
export default function ImageUploadField({ label, value, onChange, ratio = "4:3" }) {
  const fileInputRef = useRef(null);
  const [rawFile, setRawFile] = useState(null);
  const [hasFile, setHasFile] = useState(false);

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setHasFile(true);
    setRawFile(file);
  }

  function handleConfirm(blob, url) {
    onChange({ blob, url });
    setRawFile(null);
  }

  function handleCancelCrop() {
    setRawFile(null);
  }

  function handleRemove() {
    onChange({ blob: null, url: "" });
    setRawFile(null);
    setHasFile(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleRecrop() {
    const file = fileInputRef.current?.files?.[0];
    if (file) setRawFile(file);
  }

  const hasImage = Boolean(value?.url);

  return (
    <div>
      {label && (
        <label className="font-body text-xs uppercase tracking-[0.1em] text-mute mb-1 block">
          {label}
        </label>
      )}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-20 h-14 rounded-md border border-hair bg-raised flex items-center justify-center overflow-hidden shrink-0">
          {hasImage ? (
            <img src={value.url} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImageOff size={18} className="text-mute" strokeWidth={1.5} />
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="flex-1 min-w-[160px] font-body text-xs text-mute"
        />
        <button
          type="button"
          onClick={handleRecrop}
          disabled={!hasFile}
          className="shrink-0 flex items-center gap-1 rounded-md border border-hair bg-raised2 text-ink font-body text-xs px-3 py-2 hover:border-signal/50 transition-colors disabled:opacity-40"
        >
          <Crop size={13} />
          Обрезать
        </button>
        <button
          type="button"
          onClick={handleRemove}
          disabled={!hasImage}
          className="shrink-0 flex items-center gap-1 rounded-md border border-hair bg-raised text-mute font-body text-xs px-3 py-2 hover:border-amber/50 hover:text-amber transition-colors disabled:opacity-40"
        >
          <Trash2 size={13} />
          Убрать
        </button>
      </div>

      {rawFile && (
        <ImageCropperModal
          file={rawFile}
          defaultRatio={ratio}
          onConfirm={handleConfirm}
          onCancel={handleCancelCrop}
        />
      )}
    </div>
  );
}
