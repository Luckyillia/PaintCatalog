import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getVehicle, getCategory, getColorHexes } from "../data/vehicles";
import Breadcrumbs from "../components/Breadcrumbs";
import ColorChip from "../components/ColorChip";
import CopyHex from "../components/CopyHex";
import PhotoSlot from "../components/PhotoSlot";

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
  const activeHexes = getColorHexes(activeColor);

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
        {/* левая колонка — вся палитра окраски машины */}
        <div>
          <h2 className="font-body text-xs uppercase tracking-[0.15em] text-mute mb-3">
            Варианты окраски ({vehicle.colors.length})
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
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

        {/* правая колонка — hex выбранного цвета и скрин из игры */}
        <div className="flex flex-col gap-5">
          <div>
            <span className="font-mono text-xs tracking-[0.2em] text-signal uppercase">
              Стоковый цвет
            </span>
            <h2 className="font-display text-3xl tracking-wide text-ink mt-1">
              {activeColor.name}
            </h2>
          </div>

          <CopyHex hexes={activeHexes} />

          <div>
            <h3 className="font-body text-xs uppercase tracking-[0.15em] text-mute mb-3">
              В игре
            </h3>
            <PhotoSlot
              src={activeColor.image}
              alt={`${vehicle.name} — ${activeColor.name}`}
              className="w-full h-56"
              label={
                <>
                  Скрин из игры для этого цвета
                  <br />
                  пока не загружен
                </>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}