import { useEffect, useRef, useState } from "react";
import { ImagePlus, Pipette } from "lucide-react";
import { rgbToHex } from "../lib/color";

const MAX_SIDE = 2560; // очень большие скриншоты уменьшаем, иначе canvas тяжёлый
const SAMPLE = 2; // берём квадрат (2*2+1)² пикселей и усредняем — убирает шум

// Определение цвета по скриншоту: файл, перетаскивание, вставка из буфера
// (Ctrl+V) или системная «пипетка» (EyeDropper, Chrome/Edge). onPick(hex).
export default function ScreenshotPicker({ onPick }) {
  const canvasRef = useRef(null);
  const [src, setSrc] = useState(null);
  const [hover, setHover] = useState("");
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const supportsEyeDropper = typeof window !== "undefined" && "EyeDropper" in window;
  const coarse = typeof window !== "undefined" && Boolean(window.matchMedia?.("(pointer: coarse)").matches);

  function loadFile(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Нужен файл-изображение (PNG, JPG, WebP).");
      return;
    }
    setError("");
    setHover("");
    setSrc(URL.createObjectURL(file));
  }

  // освобождаем объектную ссылку при смене картинки и размонтировании
  useEffect(() => {
    if (!src) return undefined;
    return () => URL.revokeObjectURL(src);
  }, [src]);

  // рисуем загруженную картинку на canvas в натуральном размере
  useEffect(() => {
    if (!src) return undefined;
    let alive = true;
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!alive || !canvas) return;
      const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      canvas.getContext("2d", { willReadFrequently: true }).drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.onerror = () => alive && setError("Не удалось прочитать это изображение.");
    img.src = src;
    return () => {
      alive = false;
    };
  }, [src]);

  // вставка скриншота из буфера обмена; обычный текст не перехватываем
  useEffect(() => {
    function handlePaste(e) {
      const file = Array.from(e.clipboardData?.files || []).find((f) => f.type.startsWith("image/"));
      if (!file) return;
      e.preventDefault();
      loadFile(file);
    }
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  function sampleAt(e) {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return "";
    const rect = canvas.getBoundingClientRect();
    const px = Math.round((e.clientX - rect.left) * (canvas.width / rect.width));
    const py = Math.round((e.clientY - rect.top) * (canvas.height / rect.height));
    const x0 = Math.max(0, px - SAMPLE);
    const y0 = Math.max(0, py - SAMPLE);
    const w = Math.min(canvas.width, px + SAMPLE + 1) - x0;
    const h = Math.min(canvas.height, py + SAMPLE + 1) - y0;
    if (w <= 0 || h <= 0) return "";
    const { data } = canvas.getContext("2d", { willReadFrequently: true }).getImageData(x0, y0, w, h);
    let r = 0;
    let g = 0;
    let b = 0;
    const n = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }
    return rgbToHex({ r: r / n, g: g / n, b: b / n });
  }

  async function handleEyeDropper() {
    setError("");
    try {
      const { sRGBHex } = await new window.EyeDropper().open();
      onPick(sRGBHex.toUpperCase());
    } catch (err) {
      // пользователь нажал Esc — это не ошибка
      if (err?.name !== "AbortError") setError("Пипетка недоступна в этом браузере.");
    }
  }

  return (
    <details className="mb-8 border border-hair rounded-lg bg-panel group">
      <summary className="cursor-pointer select-none flex items-center gap-2 px-4 py-3 font-display text-lg tracking-wide text-ink hover:text-signal transition-colors">
        <ImagePlus size={18} className="text-signal" />
        Определить цвет по скриншоту
      </summary>

      <div className="px-4 pb-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            loadFile(e.dataTransfer.files?.[0]);
          }}
          className={`rounded-md border border-dashed px-4 py-5 text-center transition-colors ${
            dragOver ? "border-signal bg-signal/10" : "border-hair bg-raised"
          }`}
        >
          <p className="font-body text-sm text-ink">
            {coarse ? "Выбери скриншот из галереи" : "Перетащи скриншот сюда или вставь из буфера (Ctrl+V)"}
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap mt-3">
            <label className="cursor-pointer rounded-md border border-hair bg-raised2 px-3 py-2 font-body text-xs text-ink hover:border-signal/50 transition-colors focus-within:outline-2 focus-within:outline-signal">
              Выбрать файл
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  loadFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            {supportsEyeDropper && (
              <button
                type="button"
                onClick={handleEyeDropper}
                className="flex items-center gap-1.5 rounded-md border border-hair bg-raised2 px-3 py-2 font-body text-xs text-ink hover:border-signal/50 transition-colors"
              >
                <Pipette size={13} />
                Пипетка по экрану
              </button>
            )}
          </div>
        </div>

        {error && <p className="font-body text-xs text-amber mt-3">{error}</p>}

        {src && (
          <div className="mt-4">
            <div className="rounded-md border border-hair overflow-auto max-h-[28rem] chip-scroll bg-base">
              <canvas
                ref={canvasRef}
                role="img"
                aria-label="Загруженный скриншот: нажми на точку, чтобы взять её цвет"
                onPointerMove={(e) => setHover(sampleAt(e))}
                onPointerLeave={() => setHover("")}
                onClick={(e) => {
                  const hex = sampleAt(e);
                  if (hex) onPick(hex);
                }}
                style={{ cursor: "crosshair", maxWidth: "100%", display: "block" }}
              />
            </div>
            <p className="font-body text-xs text-mute mt-2 flex items-center gap-2 min-h-[1.5rem]">
              {hover ? (
                <>
                  <span className="w-4 h-4 rounded border border-hair inline-block" style={{ background: hover }} />
                  <span className="font-mono text-ink">{hover}</span>
                  <span>— нажми, чтобы выбрать</span>
                </>
              ) : (
                coarse
                  ? "Коснись нужного места на скриншоте — цвет усредняется по небольшой области."
                  : "Наведи курсор на нужное место и нажми — цвет усредняется по небольшой области."
              )}
            </p>
          </div>
        )}

        <p className="font-body text-xs text-mute mt-3 leading-snug">
          В игре освещение, тени и блики меняют цвет, поэтому точного совпадения с заводским hex ждать не стоит:
          смотри на ΔE в списке ниже и выбирай место на кузове без бликов.
        </p>
      </div>
    </details>
  );
}
