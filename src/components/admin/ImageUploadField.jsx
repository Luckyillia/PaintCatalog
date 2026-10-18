import { useEffect, useRef, useState } from "react";
import { ImageOff, Crop, Trash2, ImagePlus } from "lucide-react";
import ImageCropperModal from "./ImageCropperModal";

// value: { url: string, blob: Blob|null }
//   url  — то, что показываем (существующее фото при редактировании ИЛИ
//          превью только что обрезанного файла)
//   blob — заполняется только если пользователь выбрал/обрезал новый файл;
//          именно blob уходит в Cloudinary при сохранении формы. Если
//          blob пустой, а url есть — значит фото не менялось.
export default function ImageUploadField({ label, value, onChange, ratio = "4:3" }) {
  const fileInputRef = useRef(null);
  const [rawFile, setRawFile] = useState(null); // файл, который сейчас в окне обрезки
  const [lastFile, setLastFile] = useState(null); // последний выбранный (для «Обрезать» повторно)
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");

  // Если уронить файл мимо зоны, браузер открыл бы картинку в этой же
  // вкладке и форма потерялась бы. Гасим это поведение для файлов.
  useEffect(() => {
    function block(e) {
      if (e.dataTransfer?.types?.includes("Files")) e.preventDefault();
    }
    window.addEventListener("dragover", block);
    window.addEventListener("drop", block);
    return () => {
      window.removeEventListener("dragover", block);
      window.removeEventListener("drop", block);
    };
  }, []);

  function acceptFile(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Нужен файл-изображение (JPG, PNG, WebP).");
      return;
    }
    setError("");
    setLastFile(file);
    setRawFile(file);
  }

  function handleInputChange(e) {
    acceptFile(e.target.files?.[0]);
    e.target.value = ""; // чтобы тот же файл можно было выбрать повторно
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    acceptFile(e.dataTransfer.files?.[0]);
  }

  function handleDragOver(e) {
    if (!e.dataTransfer?.types?.includes("Files")) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDragOver(true);
  }

  function handleDragLeave(e) {
    // игнорируем «уход» на дочерние элементы зоны
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setDragOver(false);
  }

  function handleConfirm(blob, url) {
    onChange({ blob, url });
    setRawFile(null);
  }

  function handleRemove() {
    onChange({ blob: null, url: "" });
    setRawFile(null);
    setLastFile(null);
    setError("");
  }

  const hasImage = Boolean(value?.url);

  const smallBtn =
    "shrink-0 flex items-center gap-1 rounded-md border font-body text-xs px-3 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div>
      {label && (
        <label className="font-body text-xs uppercase tracking-[0.1em] text-mute mb-1 block">
          {label}
        </label>
      )}

      <div
        onDragEnter={handleDragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex items-center gap-3 flex-wrap rounded-md border border-dashed p-3 transition-colors ${
          dragOver ? "border-signal bg-signal/10" : "border-hair bg-raised"
        }`}
      >
        <div className="w-20 h-14 rounded-md border border-hair bg-raised2 flex items-center justify-center overflow-hidden shrink-0">
          {hasImage ? (
            <img src={value.url} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImageOff size={18} className="text-mute" strokeWidth={1.5} />
          )}
        </div>

        <div className="flex-1 min-w-[160px]">
          <p className="font-body text-sm text-ink">
            {dragOver ? "Отпусти, чтобы загрузить" : "Перетащи фото сюда"}
          </p>
          <p className="font-body text-[11px] text-mute mt-0.5">
            или выбери файл с устройства — потом можно обрезать
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="sr-only"
          tabIndex={-1}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`${smallBtn} border-signal/40 bg-signal/10 text-signal hover:bg-signal/20`}
        >
          <ImagePlus size={13} />
          {hasImage ? "Заменить" : "Выбрать фото"}
        </button>
        <button
          type="button"
          onClick={() => lastFile && setRawFile(lastFile)}
          disabled={!lastFile}
          className={`${smallBtn} border-hair bg-raised2 text-ink hover:border-signal/50`}
        >
          <Crop size={13} />
          Обрезать
        </button>
        <button
          type="button"
          onClick={handleRemove}
          disabled={!hasImage}
          className={`${smallBtn} border-hair bg-raised text-mute hover:border-amber/50 hover:text-amber`}
        >
          <Trash2 size={13} />
          Убрать
        </button>
      </div>

      {error && <p className="font-body text-xs text-amber mt-2">{error}</p>}

      {rawFile && (
        <ImageCropperModal
          file={rawFile}
          defaultRatio={ratio}
          onConfirm={handleConfirm}
          onCancel={() => setRawFile(null)}
        />
      )}
    </div>
  );
}