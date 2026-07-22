import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyHex({ hex }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // буфер обмена недоступен — молча игнорируем
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="group flex items-center justify-between gap-4 w-full rounded-md border border-hair bg-raised px-4 py-3 hover:border-signal/50 transition-colors"
    >
      <span className="font-mono text-lg tracking-wider text-ink">{hex}</span>
      <span className="flex items-center gap-1.5 font-body text-xs text-mute group-hover:text-signal transition-colors">
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
