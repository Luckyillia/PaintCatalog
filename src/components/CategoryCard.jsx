import { Link } from "react-router-dom";
import { getVehiclesByCategory } from "../data/vehicles";
import CarSilhouette from "./CarSilhouette";

export default function CategoryCard({ category }) {
  const count = getVehiclesByCategory(category.slug).length;

  return (
    <Link
      to={`/category/${category.slug}`}
      className="group relative rounded-lg border border-hair bg-panel overflow-hidden hover:border-signal/50 transition-colors"
    >
      {/* "ворота гаража" — верхняя штрихованная полоса как визуальный якорь */}
      <div className="h-24 bg-raised bg-shutter flex items-center justify-center">
        <CarSilhouette hex="#8b95a1" className="w-32 h-14 opacity-80" />
      </div>
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
