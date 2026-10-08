import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { track } from "@vercel/analytics";
import { formatColor } from "../lib/color";

const FORMATS = ["HEX", "RGB", "HSL"];

function HexRow({ hex, fmt }) {
  const [copied, setCopied] = useState(false);
  const text = formatColor(hex, fmt);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      return; // буфер обмена недоступен
    }
    try {
      track("copy_color", { format: fmt, hex });
    } catch {
      // аналитика не критична
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="group flex items-center justify-between gap-4 w-full rounded-md border border-hair bg-raised px-4 py-3 hover:border-signal/50 transition-colors"
    >
      <span className="font-mono text-lg tracking-wider text-ink">{text}</span>
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

// format / onFormatChange — необязательно: если не переданы, формат хранится внутри.
export default function CopyHex({ hexes, format, onFormatChange, showTabs = true }) {
  const [internal, setInternal] = useState("HEX");
  const fmt = format ?? internal;
  const setFmt = onFormatChange ?? setInternal;
  const list = Array.isArray(hexes) ? hexes : [hexes];

  return (
    <div className="flex flex-col gap-2">
      {showTabs && (
        <div className="inline-flex self-start rounded-md border border-hair overflow-hidden">
          {FORMATS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFmt(f)}
              aria-pressed={fmt === f}
              className={`font-mono text-[11px] px-3 py-1.5 transition-colors ${
                fmt === f ? "bg-signal/15 text-signal" : "bg-raised text-mute hover:text-ink"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}
      {list.map((hex) => (
        <HexRow key={hex} hex={hex} fmt={fmt} />
      ))}
    </div>
  );
}
