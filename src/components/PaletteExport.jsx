import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import { hexToRgb } from "../lib/color";

function buildCss(vehicle) {
  const lines = [];
  for (const c of vehicle.colors) {
    const base = `--${vehicle.slug}-${c.id}`;
    const hexes = c.hexes ?? [c.hex];
    hexes.forEach((h, i) => lines.push(`  ${base}${hexes.length > 1 ? `-${i + 1}` : ""}: ${h};`));
    if (c.accentHex) lines.push(`  ${base}-accent: ${c.accentHex};`);
  }
  return `:root {\n${lines.join("\n")}\n}`;
}

function buildJson(vehicle) {
  return JSON.stringify(
    {
      slug: vehicle.slug,
      name: vehicle.name,
      colors: vehicle.colors.map((c) => ({
        id: c.id,
        name: c.name,
        hexes: c.hexes ?? [c.hex],
        accent: c.accentHex ?? null,
      })),
    },
    null,
    2
  );
}

// Таблица для скриптов MTA: id цвета → { r, g, b } (у двухцветных — r1, g1, b1, r2, g2, b2).
function buildLua(vehicle) {
  const rows = vehicle.colors.map((c) => {
    const nums = (c.hexes ?? [c.hex]).slice(0, 2).flatMap((h) => {
      const { r, g, b } = hexToRgb(h);
      return [r, g, b];
    });
    return `  ["${c.id}"] = { ${nums.join(", ")} }, -- ${c.name}`;
  });
  return `-- ${vehicle.name}\nlocal colors = {\n${rows.join("\n")}\n}`;
}

export default function PaletteExport({ vehicle }) {
  const [done, setDone] = useState("");
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function copy(kind, text) {
    try {
      await navigator.clipboard.writeText(text);
      setDone(kind);
      setTimeout(() => setDone((d) => (d === kind ? "" : d)), 1500);
    } catch {
      // буфер обмена недоступен
    }
  }

  async function share() {
    try {
      await navigator.share({ title: document.title, url: window.location.href });
    } catch {
      // пользователь закрыл меню «Поделиться» — это не ошибка
    }
  }

  const items = [
    { kind: "link", label: "Ссылка на этот цвет", get: () => window.location.href },
    { kind: "css", label: "Палитра как CSS", get: () => buildCss(vehicle) },
    { kind: "json", label: "Палитра как JSON", get: () => buildJson(vehicle) },
    { kind: "lua", label: "Палитра как Lua", get: () => buildLua(vehicle) },
  ];

  return (
    <div>
      <h3 className="font-body text-xs uppercase tracking-[0.15em] text-mute mb-3">Поделиться и экспорт</h3>
      <div className="flex flex-wrap gap-2">
        {canShare && (
          <button
            type="button"
            onClick={share}
            className="flex items-center gap-1.5 rounded-md border border-signal/40 bg-signal/10 px-3 py-2 font-body text-xs text-signal hover:bg-signal/20 transition-colors"
          >
            <Share2 size={13} />
            Поделиться…
          </button>
        )}
        {items.map((it) => (
          <button
            key={it.kind}
            type="button"
            onClick={() => copy(it.kind, it.get())}
            className="flex items-center gap-1.5 rounded-md border border-hair bg-raised px-3 py-2 font-body text-xs text-ink hover:border-signal/50 hover:text-signal transition-colors"
          >
            {done === it.kind ? <Check size={13} className="text-signal" /> : <Copy size={13} />}
            {done === it.kind ? "Скопировано" : it.label}
          </button>
        ))}
      </div>
    </div>
  );
}
