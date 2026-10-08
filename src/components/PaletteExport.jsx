import { useState } from "react";
import { Copy, Check } from "lucide-react";

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

export default function PaletteExport({ vehicle }) {
  const [done, setDone] = useState("");

  async function copy(kind, text) {
    try {
      await navigator.clipboard.writeText(text);
      setDone(kind);
      setTimeout(() => setDone((d) => (d === kind ? "" : d)), 1500);
    } catch {
      // буфер обмена недоступен
    }
  }

  const items = [
    { kind: "link", label: "Ссылка на этот цвет", get: () => window.location.href },
    { kind: "css", label: "Палитра как CSS", get: () => buildCss(vehicle) },
    { kind: "json", label: "Палитра как JSON", get: () => buildJson(vehicle) },
  ];

  return (
    <div>
      <h3 className="font-body text-xs uppercase tracking-[0.15em] text-mute mb-3">Поделиться и экспорт</h3>
      <div className="flex flex-wrap gap-2">
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
