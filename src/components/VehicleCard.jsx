import { Link } from "react-router-dom";
import PhotoSlot from "./PhotoSlot";

export default function VehicleCard({ vehicle }) {
  return (
    <Link
      to={`/vehicle/${vehicle.slug}`}
      className="group rounded-lg border border-hair bg-panel overflow-hidden hover:border-signal/50 transition-colors flex flex-col"
    >
      <PhotoSlot
        src={vehicle.image}
        alt={vehicle.name}
        className="h-36"
        label="Фото пока не загружено"
      />
      <div className="p-4 flex items-center justify-between gap-3">
        <h3 className="font-display text-lg tracking-wide text-ink group-hover:text-signal transition-colors">
          {vehicle.name}
        </h3>
        <span className="font-mono text-xs text-mute whitespace-nowrap">
          {vehicle.colors.length} цветов
        </span>
      </div>
    </Link>
  );
}