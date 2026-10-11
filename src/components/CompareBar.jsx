import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { useCompare } from "../context/CompareContext";
import { useVehiclesContext } from "../context/VehiclesContext";
import { getVehicle, getColorHexes } from "../data/vehicles";
import { swatchBackground } from "../lib/color";
import { COMPARE_LIMIT } from "../lib/compare";

// Плашка внизу экрана: что сейчас выбрано для сравнения.
// Видна, пока в списке есть хотя бы один цвет; на самой странице
// сравнения не нужна.
export default function CompareBar() {
  const { items, remove, clear } = useCompare();
  const { vehicles } = useVehiclesContext();
  const { pathname } = useLocation();

  const entries = useMemo(
    () =>
      items
        .map((ref) => {
          const vehicle = getVehicle(vehicles, ref.slug);
          const color = vehicle?.colors?.find((c) => c.id === ref.colorId);
          return vehicle && color ? { ref, vehicle, color } : null;
        })
        .filter(Boolean),
    [items, vehicles]
  );

  if (entries.length === 0 || pathname.startsWith("/compare")) return null;

  return (
    <div className="fixed bottom-4 inset-x-0 z-30 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 rounded-lg border border-signal/40 bg-panel/95 backdrop-blur px-3 py-2 shadow-lg max-w-full">
        <div className="flex items-center gap-1.5">
          {entries.map(({ ref, vehicle, color }) => (
            <button
              key={`${ref.slug}:${ref.colorId}`}
              type="button"
              onClick={() => remove(ref.slug, ref.colorId)}
              title={`${vehicle.name}, ${color.name} — убрать`}
              aria-label={`Убрать из сравнения: ${vehicle.name}, ${color.name}`}
              className="w-7 h-7 rounded border border-hair shrink-0 hover:border-amber transition-colors"
              style={{ background: swatchBackground(getColorHexes(color)) }}
            />
          ))}
        </div>
        <span className="font-body text-xs text-mute whitespace-nowrap">
          {entries.length} из {COMPARE_LIMIT}
        </span>
        <Link
          to="/compare"
          className="rounded-md bg-signal text-[#06120d] font-body text-xs font-semibold px-3 py-1.5 hover:bg-signal-bright transition-colors whitespace-nowrap"
        >
          Сравнить
        </Link>
        <button
          type="button"
          onClick={clear}
          aria-label="Очистить сравнение"
          title="Очистить"
          className="text-mute hover:text-amber transition-colors"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
