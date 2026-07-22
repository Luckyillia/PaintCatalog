import { Link } from "react-router-dom";
import { Gauge, Timer } from "lucide-react";
import CarSilhouette from "./CarSilhouette";

export default function VehicleCard({ vehicle }) {
  const whiteColor = vehicle.colors[0];

  return (
    <Link
      to={`/vehicle/${vehicle.slug}`}
      className="group rounded-lg border border-hair bg-panel overflow-hidden hover:border-signal/50 transition-colors flex flex-col"
    >
      <div className="h-36 bg-raised flex items-center justify-center px-6">
        <CarSilhouette hex={whiteColor.hex} className="w-full h-24" />
      </div>
      <div className="p-4 flex-1 flex flex-col gap-3">
        <h3 className="font-display text-lg tracking-wide text-ink group-hover:text-signal transition-colors">
          {vehicle.name}
        </h3>
        <div className="flex flex-wrap gap-2 font-mono text-xs text-mute">
          <span className="flex items-center gap-1 bg-raised border border-hair rounded px-2 py-1">
            <Gauge size={12} /> {vehicle.specs.maxSpeed}
          </span>
          <span className="flex items-center gap-1 bg-raised border border-hair rounded px-2 py-1">
            <Timer size={12} /> {vehicle.specs.accel100}
          </span>
        </div>
        <div className="mt-auto flex items-center justify-between pt-2 border-t border-hair">
          <span className="font-body text-xs text-mute">
            {vehicle.colors.length} вариантов окраски
          </span>
          <span className="font-mono text-sm text-signal">
            {vehicle.priceDealer.toLocaleString("ru-RU")} ₽
          </span>
        </div>
      </div>
    </Link>
  );
}
