import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeftRight, Copy, Check, Loader2, X } from "lucide-react";
import Breadcrumbs from "../components/Breadcrumbs";
import CopyHex from "../components/CopyHex";
import PhotoSlot from "../components/PhotoSlot";
import { useCompare } from "../context/CompareContext";
import { useVehiclesContext } from "../context/VehiclesContext";
import { getVehicle, getColorHexes } from "../data/vehicles";
import { colorDistance, deltaVerdict, swatchBackground } from "../lib/color";
import { decodeCompare, encodeCompare, COMPARE_LIMIT } from "../lib/compare";
import { usePageTitle } from "../lib/usePageTitle";

const FORMATS = ["HEX", "RGB", "HSL"];

function label(e) {
  return `${e.vehicle.name}, ${e.color.name}`;
}

// /compare — выбранные цвета рядом: плашки, коды и таблица ΔE между всеми
// парами. Если в ссылке есть ?c=slug:color,… показываем её набор (так можно
// поделиться сравнением), иначе — свой список из localStorage.
export default function Compare() {
  usePageTitle("Сравнение цветов");
  const [params] = useSearchParams();
  const { items, remove, clear, replaceAll } = useCompare();
  const { vehicles, loading, error } = useVehiclesContext();
  const [fmt, setFmt] = useState("HEX");
  const [copied, setCopied] = useState(false);

  const fromLink = params.has("c");
  const refs = useMemo(() => (fromLink ? decodeCompare(params.get("c")) : items), [fromLink, params, items]);

  const entries = useMemo(
    () =>
      refs
        .map((ref) => {
          const vehicle = getVehicle(vehicles, ref.slug);
          const color = vehicle?.colors?.find((c) => c.id === ref.colorId);
          return vehicle && color ? { ref, vehicle, color, hexes: getColorHexes(color) } : null;
        })
        .filter(Boolean),
    [refs, vehicles]
  );

  const matrix = useMemo(
    () => entries.map((a) => entries.map((b) => (a === b ? null : colorDistance(a.hexes, b.hexes)))),
    [entries]
  );

  const closest = useMemo(() => {
    let best = null;
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        if (!best || matrix[i][j] < best.d) best = { a: entries[i], b: entries[j], d: matrix[i][j] };
      }
    }
    return best;
  }, [entries, matrix]);

  async function copyLink() {
    const url = `${window.location.origin}/compare?c=${encodeCompare(entries.map((e) => e.ref))}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // буфер обмена недоступен
    }
  }

  const gridCols =
    entries.length >= 4 ? "lg:grid-cols-4" : entries.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2";

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">
      <Breadcrumbs items={[{ label: "Главная", to: "/" }, { label: "Сравнение цветов" }]} />

      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="font-display text-3xl tracking-wide text-ink">Сравнение цветов</h1>
          <p className="font-body text-sm text-mute mt-1 max-w-xl">
            До {COMPARE_LIMIT} окрасок рядом, с числовой разницей ΔE между каждой парой.
          </p>
        </div>

        {entries.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={copyLink}
              className="flex items-center gap-1.5 rounded-md border border-hair bg-raised px-3 py-2 font-body text-xs text-ink hover:border-signal/50 hover:text-signal transition-colors"
            >
              {copied ? <Check size={13} className="text-signal" /> : <Copy size={13} />}
              {copied ? "Ссылка скопирована" : "Скопировать ссылку"}
            </button>
            {fromLink ? (
              <button
                type="button"
                onClick={() => replaceAll(entries.map((e) => e.ref))}
                className="rounded-md border border-hair bg-raised px-3 py-2 font-body text-xs text-ink hover:border-signal/50 hover:text-signal transition-colors"
              >
                Сохранить в мой список
              </button>
            ) : (
              <button
                type="button"
                onClick={clear}
                className="rounded-md border border-hair bg-raised px-3 py-2 font-body text-xs text-mute hover:border-amber/50 hover:text-amber transition-colors"
              >
                Очистить
              </button>
            )}
          </div>
        )}
      </div>

      {error && <p className="font-body text-sm text-amber mb-4">Ошибка загрузки: {error}</p>}

      {loading ? (
        <div className="flex items-center gap-2 font-body text-sm text-mute">
          <Loader2 size={16} className="animate-spin" />
          Загружаю...
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-lg border border-hair bg-panel px-6 py-10 text-center">
          <span className="w-12 h-12 mx-auto rounded-md bg-signal/15 border border-signal/40 flex items-center justify-center text-signal mb-4">
            <ArrowLeftRight size={20} />
          </span>
          <p className="font-body text-ink">Пока нечего сравнивать.</p>
          <p className="font-body text-sm text-mute mt-2 max-w-md mx-auto">
            Открой страницу машины и нажми «В сравнение» у нужного цвета. Так же можно добавлять цвета из
            поиска по цвету и из блока «Такой же цвет у других машин».
          </p>
          <Link to="/color-search" className="inline-block font-body text-sm text-signal hover:text-signal-bright mt-4">
            Перейти к поиску по цвету
          </Link>
        </div>
      ) : (
        <>
          <div className="inline-flex rounded-md border border-hair overflow-hidden mb-4">
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

          <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridCols} gap-4 mb-8`}>
            {entries.map((e) => (
              <div key={`${e.ref.slug}:${e.ref.colorId}`} className="rounded-lg border border-hair bg-panel overflow-hidden flex flex-col">
                <div className="relative h-36 shadow-chip" style={{ background: swatchBackground(e.hexes) }}>
                  {!fromLink && (
                    <button
                      type="button"
                      onClick={() => remove(e.ref.slug, e.ref.colorId)}
                      aria-label={`Убрать из сравнения: ${label(e)}`}
                      title="Убрать"
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-base/70 backdrop-blur-sm border border-hair/80 flex items-center justify-center text-mute hover:text-amber transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div>
                    <Link
                      to={`/vehicle/${e.vehicle.slug}?color=${encodeURIComponent(e.color.id)}`}
                      className="font-display text-lg tracking-wide text-ink hover:text-signal transition-colors"
                    >
                      {e.vehicle.name}
                    </Link>
                    <p className="font-body text-sm text-mute">{e.color.name}</p>
                  </div>
                  <CopyHex hexes={e.hexes} format={fmt} showTabs={false} />
                  {e.color.image && (
                    <PhotoSlot
                      src={e.color.image}
                      alt={`${e.vehicle.name} — ${e.color.name}`}
                      className="w-full aspect-[16/10]"
                      width={480}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {entries.length >= 2 ? (
            <section>
              <h2 className="font-display text-2xl tracking-wide text-ink mb-2">Разница между цветами</h2>
              {closest && (
                <p className="font-body text-sm text-mute mb-4">
                  Ближе всего друг к другу: {label(closest.a)} и {label(closest.b)} — ΔE {closest.d.toFixed(1)},{" "}
                  {deltaVerdict(closest.d).toLowerCase()}.
                </p>
              )}
              <div className="overflow-x-auto chip-scroll rounded-lg border border-hair bg-panel">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr>
                      <th className="p-3" />
                      {entries.map((e) => (
                        <th key={`h-${e.ref.slug}:${e.ref.colorId}`} scope="col" className="p-3 font-body text-xs font-normal text-mute align-bottom min-w-[8rem]">
                          <span className="block w-6 h-6 rounded border border-hair mb-1" style={{ background: swatchBackground(e.hexes) }} />
                          {label(e)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((row, i) => (
                      <tr key={`r-${row.ref.slug}:${row.ref.colorId}`} className="border-t border-hair">
                        <th scope="row" className="p-3 font-body text-xs font-normal text-mute min-w-[8rem]">
                          {label(row)}
                        </th>
                        {entries.map((col, j) => {
                          const d = matrix[i][j];
                          return (
                            <td key={`c-${col.ref.slug}:${col.ref.colorId}`} className="p-3">
                              {d === null ? (
                                <span className="font-mono text-xs text-mute">—</span>
                              ) : (
                                <>
                                  <span className={`font-mono text-sm ${d < 6 ? "text-signal" : "text-ink"}`}>
                                    {d.toFixed(1)}
                                  </span>
                                  <span className="block font-body text-[11px] text-mute">{deltaVerdict(d)}</span>
                                </>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : (
            <p className="font-body text-sm text-mute">Добавь ещё хотя бы один цвет, чтобы увидеть разницу между ними.</p>
          )}
        </>
      )}
    </div>
  );
}
