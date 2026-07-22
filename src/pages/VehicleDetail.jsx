import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getVehicle, getCategory } from "../data/vehicles";
import Breadcrumbs from "../components/Breadcrumbs";
import CarSilhouette from "../components/CarSilhouette";
import ColorChip from "../components/ColorChip";
import CopyHex from "../components/CopyHex";
import IngameShotPlaceholder from "../components/IngameShotPlaceholder";

export default function VehicleDetail() {
  const { slug } = useParams();
  const vehicle = getVehicle(slug);
  const [activeId, setActiveId] = useState(vehicle?.colors[0]?.id);

  if (!vehicle) {
    return (
      <div className="max-w-6xl mx-auto px-5 py-10">
        <p className="font-body text-mute">
          Такой машины нет.{" "}
          <Link to="/" className="text-signal">
            Вернуться на главную
          </Link>
        </p>
      </div>
    );
  }

  const category = getCategory(vehicle.category);
  const activeColor =
    vehicle.colors.find((c) => c.id === activeId) ?? vehicle.colors[0];

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">
      <Breadcrumbs
        items={[
          { label: "Главная", to: "/" },
          { label: category?.name ?? "Категория", to: `/category/${vehicle.category}` },
          { label: vehicle.name },
        ]}
      />

      <h1 className="font-display text-3xl tracking-wide text-ink mb-6">
        {vehicle.name}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* левая колонка — фото в выбранном цвете */}
        <div>
          <div className="rounded-lg border border-hair bg-raised p-8 flex items-center justify-center">
            <CarSilhouette hex={activeColor.hex} className="w-full h-40" />
          </div>

          <div className="mt-4">
            <h2 className="font-body text-xs uppercase tracking-[0.15em] text-mute mb-3">
              Варианты окраски
            </h2>
            <div className="flex gap-3 overflow-x-auto chip-scroll pb-2">
              {vehicle.colors.map((color) => (
                <ColorChip
                  key={color.id}
                  color={color}
                  active={color.id === activeColor.id}
                  onClick={() => setActiveId(color.id)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* правая колонка — название цвета, hex, скрин из игры */}
        <div className="flex flex-col gap-5">
          <div>
            <span className="font-mono text-xs tracking-[0.2em] text-signal uppercase">
              Стоковый цвет
            </span>
            <h2 className="font-display text-3xl tracking-wide text-ink mt-1">
              {activeColor.name}
            </h2>
          </div>

          <CopyHex hex={activeColor.hex} />

          <div>
            <h3 className="font-body text-xs uppercase tracking-[0.15em] text-mute mb-3">
              В игре
            </h3>
            <IngameShotPlaceholder hex={activeColor.hex} className="w-full h-56" />
          </div>
        </div>
      </div>
    </div>
  );
}
