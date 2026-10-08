import { useState } from "react";
import { ImageOff } from "lucide-react";
import { optimizeImage } from "../lib/imageUrl";

export default function PhotoSlot({ src, alt = "", className = "", label, priority = false, width = 640 }) {
  const [broken, setBroken] = useState(false);
  const showFallback = !src || broken;

  const optimized = optimizeImage(src, width);
  const srcSet = optimized !== src ? `${optimized} 1x, ${optimizeImage(src, width * 2)} 2x` : undefined;

  return (
    <div className={`relative overflow-hidden rounded-md bg-raised flex items-center justify-center ${className}`}>
      {!showFallback && (
        <img
          src={optimized}
          srcSet={srcSet}
          alt={alt}
          className="w-full h-full object-cover"
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onError={() => setBroken(true)}
        />
      )}
      {showFallback && (
        <div className="flex flex-col items-center gap-2 text-mute px-4 text-center">
          <ImageOff size={22} strokeWidth={1.5} />
          {label && <span className="font-body text-xs leading-snug">{label}</span>}
        </div>
      )}
    </div>
  );
}
