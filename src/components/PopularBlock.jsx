import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Flame } from "lucide-react";
import VehicleCard from "./VehicleCard";
import { useVehiclesContext } from "../context/VehiclesContext";
import { getVehicle, getColorHexes } from "../data/vehicles";
import { swatchBackground } from "../lib/color";
import { fetchPopular } from "../lib/popular";

// «Популярное» на главной: самые открываемые машины и самые копируемые цвета.
// Данные собирает api/track.js; пока их нет, блок не показывается.
export default function PopularBlock() {
  const { vehicles } = useVehiclesContext();
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchPopular().then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const topVehicles = useMemo(
    () => (data?.vehicles ?? []).map((h) => getVehicle(vehicles, h.slug)).filter(Boolean).slice(0, 6),
    [data, vehicles]
  );

  const topColors = useMemo(
    () =>
      (data?.colors ?? [])
        .map((h) => {
          const vehicle = getVehicle(vehicles, h.slug);
          const color = vehicle?.colors?.find((c) => c.id === h.colorId);
          return vehicle && color ? { vehicle, color } : null;
        })
        .filter(Boolean)
        .slice(0, 8),
    [data, vehicles]
  );

  if (topVehicles.length === 0 && topColors.length === 0) return null;

  return (
    <>
      {topVehicles.length > 0 && (
        <>
          <h2 className="font-display text-2xl tracking-wide text-ink mt-12 mb-4 flex items-center gap-3">
            <Flame size={20} className="text-signal shrink-0" />
            Популярные машины
            <span className="flex-1 h-px bg-hair" />
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topVehicles.map((v) => (
              <VehicleCard key={v.slug} vehicle={v} />
            ))}
          </div>
        </>
      )}

      {topColors.length > 0 && (
        <>
          <h2 className="font-display text-2xl tracking-wide text-ink mt-12 mb-4 flex items-center gap-3">
            Часто копируют
            <span className="flex-1 h-px bg-hair" />
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {topColors.map(({ vehicle, color }) => (
              <Link
                key={`${vehicle.slug}:${color.id}`}
                to={`/vehicle/${vehicle.slug}?color=${encodeURIComponent(color.id)}`}
                className="group flex items-center gap-3 rounded-lg border border-hair bg-panel p-3 hover:border-signal/50 transition-colors"
              >
                <span
                  className="w-11 h-11 rounded-md border border-hair shadow-chip shrink-0"
                  style={{ background: swatchBackground(getColorHexes(color)) }}
                />
                <span className="min-w-0">
                  <span className="block font-display text-sm tracking-wide text-ink truncate group-hover:text-signal transition-colors">
                    {vehicle.name}
                  </span>
                  <span className="block font-body text-xs text-mute truncate">{color.name}</span>
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
