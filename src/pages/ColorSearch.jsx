import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Pipette, Loader2 } from "lucide-react";
import Breadcrumbs from "../components/Breadcrumbs";
import { useVehiclesContext } from "../context/VehiclesContext";
import { findClosestColors, parseHex } from "../lib/color";
import { usePageTitle } from "../lib/usePageTitle";

function verdict(d) {
  if (d < 2) return "Практически идентичен";
  if (d < 6) return "Очень близко";
  if (d < 12) return "Похож";
  return "Заметно отличается";
}

function swatchBackground(hexes) {
  return hexes.length > 1 ? `linear-gradient(135deg, ${hexes[0]} 50%, ${hexes[1]} 50%)` : hexes[0];
}

export default function ColorSearch() {
  usePageTitle("Поиск по цвету");
  const [params, setParams] = useSearchParams();
  const [input, setInput] = useState(() => (params.get("hex") ? `#${params.get("hex")}` : "#39C98F"));
  const { vehicles, loading, error } = useVehiclesContext();

  const hex = parseHex(input);
  const results = useMemo(() => (hex ? findClosestColors(vehicles, hex, 24) : []), [vehicles, hex]);

  function handleInput(value) {
    setInput(value);
    const parsed = parseHex(value);
    if (parsed) setParams({ hex: parsed.slice(1) }, { replace: true });
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">
      <Breadcrumbs items={[{ label: "Главная", to: "/" }, { label: "Поиск по цвету" }]} />

      <h1 className="font-display text-3xl tracking-wide text-ink mb-2">Поиск по цвету</h1>
      <p className="font-body text-mute mb-6 max-w-xl">
        Введи hex или выбери цвет — покажем стоковые окраски, ближайшие к нему по восприятию (ΔE в Lab).
      </p>

      <div className="flex items-center gap-3 mb-8 flex-wrap">
        <input
          type="color"
          value={hex ?? "#39C98F"}
          onChange={(e) => handleInput(e.target.value.toUpperCase())}
          className="w-14 h-12 rounded border border-hair bg-raised cursor-pointer"
          aria-label="Выбрать цвет"
        />
        <input
          value={input}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="#RRGGBB"
          className={`w-40 bg-raised border rounded-md px-3 py-3 font-mono text-lg text-ink focus:outline-none ${
            hex ? "border-hair focus:border-signal/50" : "border-amber/60"
          }`}
        />
        {!hex && <span className="font-body text-xs text-amber">Нужен hex вида #RRGGBB или #RGB</span>}
      </div>

      {error && <p className="font-body text-sm text-amber mb-4">Ошибка загрузки: {error}</p>}

      {loading ? (
        <div className="flex items-center gap-2 font-body text-sm text-mute">
          <Loader2 size={16} className="animate-spin" />
          Загружаю...
        </div>
      ) : (
        hex && (
          <>
            <h2 className="font-display text-xl tracking-wide text-ink mb-4 flex items-center gap-2">
              <Pipette size={18} className="text-signal" />
              Ближайшие окраски
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {results.map((r) => (
                <Link
                  key={`${r.vehicle.slug}-${r.color.id}`}
                  to={`/vehicle/${r.vehicle.slug}?color=${encodeURIComponent(r.color.id)}`}
                  className="group flex items-center gap-3 rounded-lg border border-hair bg-panel p-3 hover:border-signal/50 transition-colors"
                >
                  <span
                    className="w-14 h-14 rounded-md border border-hair shadow-chip shrink-0"
                    style={{ background: swatchBackground(r.hexes) }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-base tracking-wide text-ink truncate group-hover:text-signal transition-colors">
                      {r.vehicle.name}
                    </span>
                    <span className="block font-body text-xs text-mute truncate">{r.color.name}</span>
                    <span className="block font-mono text-[11px] text-mute">
                      {r.matchHex.toUpperCase()} · ΔE {r.distance.toFixed(1)}
                    </span>
                  </span>
                  <span className="hidden sm:block font-body text-[11px] text-signal text-right w-20 shrink-0">
                    {verdict(r.distance)}
                  </span>
                </Link>
              ))}
            </div>
          </>
        )
      )}
    </div>
  );
}
