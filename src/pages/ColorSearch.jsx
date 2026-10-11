import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Pipette } from "lucide-react";
import Breadcrumbs from "../components/Breadcrumbs";
import CompareButton from "../components/CompareButton";
import ScreenshotPicker from "../components/ScreenshotPicker";
import { VehicleGridSkeleton } from "../components/Skeleton";
import { useVehiclesContext } from "../context/VehiclesContext";
import {
  COLOR_FAMILIES,
  deltaVerdict,
  findClosestColors,
  listColorsByFamily,
  parseHex,
  swatchBackground,
} from "../lib/color";
import { usePageTitle } from "../lib/usePageTitle";

const PAGE = 60;

function ResultCard({ r }) {
  return (
    <Link
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
          {r.matchHex.toUpperCase()}
          {r.distance !== undefined && ` · ΔE ${r.distance.toFixed(1)}`}
        </span>
        {r.distance !== undefined && (
          <span className="block sm:hidden font-body text-[11px] text-signal">{deltaVerdict(r.distance)}</span>
        )}
      </span>
      {r.distance !== undefined && (
        <span className="hidden sm:block font-body text-[11px] leading-tight text-signal text-right w-24 shrink-0">
          {deltaVerdict(r.distance)}
        </span>
      )}
      <CompareButton slug={r.vehicle.slug} colorId={r.color.id} className="shrink-0" />
    </Link>
  );
}

export default function ColorSearch() {
  usePageTitle("Поиск по цвету");
  const [params, setParams] = useSearchParams();
  const [input, setInput] = useState(() => (params.get("hex") ? `#${params.get("hex")}` : "#39C98F"));
  const [shown, setShown] = useState(PAGE);
  const { vehicles, loading, error } = useVehiclesContext();

  const familyParam = params.get("family") ?? "";
  const family = COLOR_FAMILIES.some((f) => f.id === familyParam) ? familyParam : "";

  const hex = parseHex(input);
  const closest = useMemo(
    () => (hex && !family ? findClosestColors(vehicles, hex, 24) : []),
    [vehicles, hex, family]
  );
  const byFamily = useMemo(() => (family ? listColorsByFamily(vehicles, family) : []), [vehicles, family]);

  function updateParams(mutate) {
    const next = new URLSearchParams(params);
    mutate(next);
    setParams(next, { replace: true });
  }

  function handleInput(value) {
    setInput(value);
    const parsed = parseHex(value);
    if (parsed) updateParams((p) => p.set("hex", parsed.slice(1)));
  }

  function selectFamily(id) {
    setShown(PAGE);
    updateParams((p) => (id ? p.set("family", id) : p.delete("family")));
  }

  const familyLabel = COLOR_FAMILIES.find((f) => f.id === family)?.label.toLowerCase();

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">
      <Breadcrumbs items={[{ label: "Главная", to: "/" }, { label: "Поиск по цвету" }]} />

      <h1 className="font-display text-3xl tracking-wide text-ink mb-2">Поиск по цвету</h1>
      <p className="font-body text-mute mb-6 max-w-xl">
        Введи hex, выбери цвет или возьми его со скриншота — покажем стоковые окраски, ближайшие к нему по
        восприятию (ΔE в Lab). Или просто просмотри окраски по оттенкам.
      </p>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
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

      <ScreenshotPicker onPick={handleInput} />

      <div className="flex items-center gap-2 flex-wrap mb-8" role="group" aria-label="Режим поиска">
        <button
          type="button"
          onClick={() => selectFamily("")}
          aria-pressed={!family}
          className={`rounded-full border px-3 py-1.5 font-body text-xs transition-colors ${
            !family ? "border-signal/50 bg-signal/10 text-signal" : "border-hair bg-raised text-ink hover:border-mute"
          }`}
        >
          Ближайшие к цвету
        </button>
        {COLOR_FAMILIES.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => selectFamily(f.id)}
            aria-pressed={family === f.id}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-body text-xs transition-colors ${
              family === f.id ? "border-signal/50 bg-signal/10 text-signal" : "border-hair bg-raised text-ink hover:border-mute"
            }`}
          >
            <span className="w-3 h-3 rounded-full border border-hair/80" style={{ background: f.sample }} />
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="font-body text-sm text-amber mb-4">Ошибка загрузки: {error}</p>}

      {loading ? (
        <VehicleGridSkeleton count={6} />
      ) : family ? (
        <>
          <h2 className="font-display text-xl tracking-wide text-ink mb-4 flex items-center gap-2">
            <Pipette size={18} className="text-signal" />
            Окраски: {familyLabel}
            <span className="font-mono text-xs text-mute">{byFamily.length}</span>
          </h2>
          {byFamily.length === 0 ? (
            <p className="font-body text-mute">В этом оттенке пока нет окрасок.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {byFamily.slice(0, shown).map((r) => (
                  <ResultCard key={`${r.vehicle.slug}-${r.color.id}`} r={r} />
                ))}
              </div>
              {byFamily.length > shown && (
                <button
                  type="button"
                  onClick={() => setShown((n) => n + PAGE)}
                  className="mt-4 rounded-md border border-hair bg-raised px-4 py-2 font-body text-sm text-ink hover:border-signal/50 hover:text-signal transition-colors"
                >
                  Показать ещё ({byFamily.length - shown})
                </button>
              )}
            </>
          )}
        </>
      ) : (
        hex && (
          <>
            <h2 className="font-display text-xl tracking-wide text-ink mb-4 flex items-center gap-2">
              <Pipette size={18} className="text-signal" />
              Ближайшие окраски
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {closest.map((r) => (
                <ResultCard key={`${r.vehicle.slug}-${r.color.id}`} r={r} />
              ))}
            </div>
          </>
        )
      )}
    </div>
  );
}
