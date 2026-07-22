import { Link } from "react-router-dom";
import { getVehiclesByCategory } from "../data/vehicles";
import PhotoSlot from "./PhotoSlot";

export default function CategoryCard({ category }) {
  const count = getVehiclesByCategory(category.slug).length;

  return (
    <Link
      to={`/category/${category.slug}`}
      className="group relative rounded-lg border border-hair bg-panel overflow-hidden hover:border-signal/50 transition-colors"
    >
      <PhotoSlot
        src={category.image}
        alt={category.name}
        className="h-24"
        label="Фото категории"
      />
      <div className="p-4 flex items-center justify-between">
        <span className="font-display text-lg tracking-wide text-ink group-hover:text-signal transition-colors">
          {category.name}
        </span>
        <span className="font-mono text-xs text-mute">{count}</span>
      </div>
      <div className="h-1 w-full bg-hair group-hover:bg-signal/60 transition-colors" />
    </Link>
  );
}