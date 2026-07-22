import { useState } from "react";
import { ImageOff } from "lucide-react";

export default function PhotoSlot({ src, alt = "", className = "", label }) {
  const [broken, setBroken] = useState(false);
  const showFallback = !src || broken;

  return (
    <div
      className={`relative overflow-hidden rounded-md bg-raised flex items-center justify-center ${className}`}
    >
      {!showFallback && (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setBroken(true)}
        />
      )}
      {showFallback && (
        <div className="flex flex-col items-center gap-2 text-mute px-4 text-center">
          <ImageOff size={22} strokeWidth={1.5} />
          {label && (
            <span className="font-body text-xs leading-snug">{label}</span>
          )}
        </div>
      )}
    </div>
  );
}