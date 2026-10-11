import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { getVehicle, getCategory, getColorHexes, getColorAccentHex } from "../data/vehicles";
import { useVehiclesContext } from "../context/VehiclesContext";
import { useFavorites } from "../context/FavoritesContext";
import { usePageTitle } from "../lib/usePageTitle";
import { sortColorsByHue } from "../lib/color";
import Breadcrumbs from "../components/Breadcrumbs";
import ColorChip from "../components/ColorChip";
import CopyHex from "../components/CopyHex";
import PaletteExport from "../components/PaletteExport";
import PhotoSlot from "../components/PhotoSlot";
import TagChip from "../components/TagChip";
import FavoriteButton from "../components/FavoriteButton";
import CompareButton from "../components/CompareButton";
import ReportButton from "../components/ReportButton";
import SimilarColors from "../components/SimilarColors";
import { VehicleDetailSkeleton } from "../components/Skeleton";

const ORDERS = [
  { id: "default", label: "Как в списке" },
  { id: "hue", label: "По оттенку" },
];

export default function VehicleDetail() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const { vehicles, loading, error } = useVehiclesContext();
  const { addRecentlyViewed } = useFavorites();
  const [fmt, setFmt] = useState("HEX");
  const [colorOrder, setColorOrder] = useState("default");
  const vehicle = getVehicle(vehicles, slug);

  // активный цвет живёт в ссылке: /vehicle/<slug>?color=<id>
  const currentActiveId = params.get("color") ?? vehicle?.colors?.[0]?.id;
  const titleColor = vehicle?.colors?.find((c) => c.id === currentActiveId)?.name;
  usePageTitle(vehicle ? `${vehicle.name}${titleColor ? ` — ${titleColor}` : ""}` : null);

  useEffect(() => {
    if (vehicle?.slug) addRecentlyViewed(vehicle.slug);
  }, [vehicle?.slug, addRecentlyViewed]);

  if (loading) {
    return <VehicleDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-5 py-10">
        <p className="font-body text-amber">Ошибка загрузки: {error}</p>
      </div>
    );
  }

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
  const breadcrumbItems = [
    { label: "Главная", to: "/" },
    { label: category?.name ?? "Категория", to: `/category/${vehicle.category}` },
    { label: vehicle.name },
  ];

  if (!vehicle.colors || vehicle.colors.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-5 py-10">
        <Breadcrumbs items={breadcrumbItems} />
        <h1 className="font-display text-3xl tracking-wide text-ink mb-3">{vehicle.name}</h1>
        <p className="font-body text-mute">Для этой машины пока не добавлено ни одного цвета окраски.</p>
      </div>
    );
  }

  const activeColor = vehicle.colors.find((c) => c.id === currentActiveId) ?? vehicle.colors[0];
  const activeHexes = getColorHexes(activeColor);
  const activeAccentHex = getColorAccentHex(activeColor);
  const orderedColors = colorOrder === "hue" ? sortColorsByHue(vehicle.colors) : vehicle.colors;

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="flex items-start justify-between gap-4 mb-3">
        <h1 className="font-display text-3xl tracking-wide text-ink">{vehicle.name}</h1>
        <FavoriteButton slug={vehicle.slug} size="lg" className="mt-1 shrink-0" />
      </div>

      {vehicle.tags?.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mb-6">
          {vehicle.tags.map((tagId) => (
            <TagChip key={tagId} tagId={tagId} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-6">
          <div>
            <span className="font-mono text-xs tracking-[0.2em] text-signal uppercase">Стоковый цвет</span>
            <h2 className="font-display text-3xl tracking-wide text-ink mt-1 mb-4">{activeColor.name}</h2>
            <CopyHex hexes={activeHexes} format={fmt} onFormatChange={setFmt} />

            {activeAccentHex && (
              <div className="mt-4">
                <span className="font-body text-xs uppercase tracking-[0.15em] text-mute mb-2 block">
                  Цвет вставок
                </span>
                <CopyHex hexes={activeAccentHex} format={fmt} onFormatChange={setFmt} showTabs={false} />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-4">
              <CompareButton slug={vehicle.slug} colorId={activeColor.id} withLabel />
              <ReportButton kind="color_error" vehicle={vehicle} color={activeColor} label="Ошибка в цвете?" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="font-body text-xs uppercase tracking-[0.15em] text-mute">
                Варианты окраски ({vehicle.colors.length})
              </h3>
              {vehicle.colors.length > 2 && (
                <div className="inline-flex rounded-md border border-hair overflow-hidden" role="group" aria-label="Порядок цветов">
                  {ORDERS.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setColorOrder(o.id)}
                      aria-pressed={colorOrder === o.id}
                      className={`font-body text-[11px] px-2.5 py-1 transition-colors ${
                        colorOrder === o.id ? "bg-signal/15 text-signal" : "bg-raised text-mute hover:text-ink"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {orderedColors.map((color) => (
                <ColorChip
                  key={color.id}
                  color={color}
                  active={color.id === activeColor.id}
                  onClick={() => setParams({ color: color.id }, { replace: true })}
                />
              ))}
            </div>
          </div>

          <SimilarColors vehicles={vehicles} vehicle={vehicle} color={activeColor} />

          <PaletteExport vehicle={vehicle} />
        </div>

        <div className="flex flex-col">
          <h3 className="font-body text-xs uppercase tracking-[0.15em] text-mute mb-3">В игре</h3>
          <PhotoSlot
            src={activeColor.image}
            alt={`${vehicle.name} — ${activeColor.name}`}
            className="w-full aspect-[16/10]"
            width={900}
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
  );
}
