import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { track as analyticsTrack } from "@vercel/analytics";
import { COLOR_FORMATS, formatColorExt, formatLuaColors } from "../lib/colorFormats";
import { useColorFormat } from "../lib/useColorFormat";
import { trackHit } from "../lib/popular";

function CopyRow({ text, fmt, hex, trackInfo }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      return; // буфер обмена недоступен
    }
    try {
      navigator.vibrate?.(15); // лёгкий отклик на телефоне, где поддерживается
    } catch {
      // вибрация не критична
    }
    try {
      analyticsTrack("copy_color", { format: fmt, hex });
      if (trackInfo) trackHit({ kind: "color", slug: trackInfo.slug, colorId: trackInfo.colorId });
    } catch {
      // аналитика не критична
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="group flex items-center justify-between gap-4 w-full rounded-md border border-hair bg-raised px-4 py-3 hover:border-signal/50 transition-colors text-left"
    >
      <span
        className={`font-mono text-ink min-w-0 ${
          fmt === "LUA" ? "text-sm break-all" : "text-lg tracking-wider"
        }`}
      >
        {text}
      </span>
      <span className="flex items-center gap-1.5 font-body text-xs text-mute group-hover:text-signal transition-colors shrink-0">
        {copied ? (
          <>
            <Check size={14} className="text-signal" />
            Скопировано
          </>
        ) : (
          <>
            <Copy size={14} />
            Копировать
          </>
        )}
      </span>
    </button>
  );
}

// format / onFormatChange — необязательно: если не переданы, формат хранится
// внутри (и запоминается в браузере). track — { slug, colorId }: копирование
// попадёт в счётчик популярности.
export default function CopyHex({ hexes, format, onFormatChange, showTabs = true, track }) {
  const [internal, setInternal] = useColorFormat();
  const fmt = format ?? internal;
  const setFmt = onFormatChange ?? setInternal;
  const list = Array.isArray(hexes) ? hexes : [hexes];

  // У двухцветной окраски в формате Lua обе половины идут одной строкой.
  const rows =
    fmt === "LUA" && list.length > 1
      ? [{ key: "lua", text: formatLuaColors(list), hex: list[0] }]
      : list.map((h) => ({ key: h, text: formatColorExt(h, fmt), hex: h }));

  return (
    <div className="flex flex-col gap-2">
      {showTabs && (
        <div className="inline-flex self-start max-w-full overflow-x-auto chip-scroll rounded-md border border-hair">
          {COLOR_FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFmt(f.id)}
              aria-pressed={fmt === f.id}
              className={`font-mono text-[11px] px-3 py-1.5 whitespace-nowrap transition-colors ${
                fmt === f.id ? "bg-signal/15 text-signal" : "bg-raised text-mute hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
      {rows.map((r) => (
        <CopyRow key={r.key} text={r.text} fmt={fmt} hex={r.hex} trackInfo={track} />
      ))}
    </div>
  );
}
