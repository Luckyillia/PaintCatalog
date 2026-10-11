import { useMemo } from "react";
import { Link } from "react-router-dom";
import { getColorHexes } from "../data/vehicles";
import { findSimilarColors, deltaVerdict, swatchBackground } from "../lib/color";
import CompareButton from "./CompareButton";

const MAX_DELTA = 3;

// «Такой же цвет у других машин»: окраски других машин с ΔE ≤ 3 к активному
// цвету — полезно, когда нужно подобрать замену или сверить с другой машиной.
export default function SimilarColors({ vehicles, vehicle, color }) {
  const similar = useMemo(
    () =>
      findSimilarColors(vehicles, getColorHexes(color), {
        excludeSlug: vehicle.slug,
        maxDelta: MAX_DELTA,
        limit: 6,
      }),
    [vehicles, vehicle.slug, color]
  );

  const searchHex = getColorHexes(color)[0].replace("#", "");

  return (
    <div>
      <h3 className="font-body text-xs uppercase tracking-[0.15em] text-mute mb-3">
        Такой же цвет у других машин
      </h3>

      {similar.length === 0 ? (
        <p className="font-body text-xs text-mute">
          Похожих стоковых окрасок (ΔE до {MAX_DELTA}) у других машин на сайте нет.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {similar.map((r) => (
            <Link
              key={`${r.vehicle.slug}-${r.color.id}`}
              to={`/vehicle/${r.vehicle.slug}?color=${encodeURIComponent(r.color.id)}`}
              className="group relative flex items-center gap-3 rounded-lg border border-hair bg-panel p-2.5 hover:border-signal/50 transition-colors"
            >
              <span
                className="w-11 h-11 rounded-md border border-hair shadow-chip shrink-0"
                style={{ background: swatchBackground(r.hexes) }}
              />
              <span className="min-w-0 flex-1 pr-8">
                <span className="block font-display text-sm tracking-wide text-ink truncate group-hover:text-signal transition-colors">
                  {r.vehicle.name}
                </span>
                <span className="block font-body text-xs text-mute truncate">{r.color.name}</span>
                <span className="block font-mono text-[11px] text-mute truncate">
                  ΔE {r.distance.toFixed(1)}, {deltaVerdict(r.distance).toLowerCase()}
                </span>
              </span>
              <CompareButton
                slug={r.vehicle.slug}
                colorId={r.color.id}
                className="absolute top-2 right-2"
              />
            </Link>
          ))}
        </div>
      )}

      <Link
        to={`/color-search?hex=${searchHex}`}
        className="inline-block font-body text-xs text-signal hover:text-signal-bright transition-colors mt-3"
      >
        Показать ближайшие в поиске по цвету
      </Link>
    </div>
  );
}
