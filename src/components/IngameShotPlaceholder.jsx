import { ImageOff } from "lucide-react";

// Заглушка под скриншот "как цвет выглядит в игре".
// Позже сюда просто подставляется реальный img.
export default function IngameShotPlaceholder({ hex, className = "" }) {
  return (
    <div
      className={`relative overflow-hidden rounded-md border border-hair bg-panel flex items-center justify-center ${className}`}
    >
      <div
        className="absolute inset-0 opacity-25"
        style={{
          background: `radial-gradient(circle at 30% 20%, ${hex}, transparent 60%)`,
        }}
      />
      <div className="relative z-10 flex flex-col items-center gap-2 text-mute px-4 text-center">
        <ImageOff size={22} strokeWidth={1.5} />
        <span className="font-body text-xs leading-snug">
          Скрин из игры для этого цвета
          <br />
          пока не загружен
        </span>
      </div>
    </div>
  );
}
