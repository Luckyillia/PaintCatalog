import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getVehicle, getVehiclesByCategory, getCategory, getColorHexes, getColorAccentHex } from "../data/vehicles";
import { useVehiclesContext } from "../context/VehiclesContext";
import { useFavorites } from "../context/FavoritesContext";
import { usePageTitle } from "../lib/usePageTitle";
import { COLOR_FAMILIES, sortColorsByHue } from "../lib/color";
import { colorFamilyOf, sortVehicles } from "../lib/vehicleFilters";
import { useColorFormat } from "../lib/useColorFormat";
import { trackHit } from "../lib/popular";
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

// Если цветов больше этого числа, над сеткой появляется фильтр по оттенку.
const FILTER_FROM = 12;
const SWIPE_MIN_PX = 50;

// key={slug}: при переходе на другую машину (кнопки «следующая / предыдущая»)
// порядок и фильтр цветов сбрасываются.
export default function VehicleDetail() {
  const { slug } = useParams();
  return <VehicleView key={slug} slug={slug} />;
}

function VehicleView({ slug }) {
  const [params, setParams] = useSearchParams();
  const { vehicles, loading, error } = useVehiclesContext();
  const { addRecentlyViewed } = useFavorites();
  const [fmt, setFmt] = useColorFormat();
  const [colorOrder, setColorOrder] = useState("default");
  const [family, setFamily] = useState("");
  const touchRef = useRef(null);
  const vehicle = getVehicle(vehicles, slug);

  // активный цвет живёт в ссылке: /vehicle/<slug>?color=<id>
  const currentActiveId = params.get("color") ?? vehicle?.colors?.[0]?.id;
  const titleColor = vehicle?.colors?.find((c) => c.id === currentActiveId)?.name;
  usePageTitle(vehicle ? `${vehicle.name}${titleColor ? ` — ${titleColor}` : ""}` : null);

  useEffect(() => {
    if (vehicle?.slug) {
      addRecentlyViewed(vehicle.slug);
      trackHit({ kind: "vehicle", slug: vehicle.slug });
    }
  }, [vehicle?.slug, addRecentlyViewed]);

  // цвета в выбранном порядке и с учётом фильтра по оттенку
  const shownColors = useMemo(() => {
    const colors = vehicle?.colors ?? [];
    const ordered = colorOrder === "hue" ? sortColorsByHue(colors) : colors;
    return family ? ordered.filter((c) => colorFamilyOf(c) === family) : ordered;
  }, [vehicle, colorOrder, family]);

  const familyCounts = useMemo(() => {
    const counts = new Map();
    for (const c of vehicle?.colors ?? []) {
      const f = colorFamilyOf(c);
      if (f) counts.set(f, (counts.get(f) || 0) + 1);
    }
    return counts;
  }, [vehicle]);

  // соседние машины категории (в том же порядке, что и в списке)
  const neighbours = useMemo(() => {
    if (!vehicle) return { prev: null, next: null, index: 0, total: 0 };
    const list = sortVehicles(getVehiclesByCategory(vehicles, vehicle.category), "name");
    const i = list.findIndex((v) => v.slug === vehicle.slug);
    return { prev: list[i - 1] ?? null, next: list[i + 1] ?? null, index: i, total: list.length };
  }, [vehicles, vehicle]);

  // листание цветов: стрелки на клавиатуре и свайп по фото
  const step = useCallback(
    (dir) => {
      const n = shownColors.length;
      if (n < 2) return;
      const i = shownColors.findIndex((c) => c.id === currentActiveId);
      const next = i === -1 ? 0 : (i + dir + n) % n;
      setParams({ color: shownColors[next].id }, { replace: true });
    },
    [shownColors, currentActiveId, setParams]
  );

  useEffect(() => {
    function onKey(e) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const t = e.target;
      if (t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (document.querySelector('[role="dialog"]')) return;
      step(e.key === "ArrowRight" ? 1 : -1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  function handleTouchStart(e) {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY };
  }

  function handleTouchEnd(e) {
    const start = touchRef.current;
    touchRef.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) > SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
  }

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
  const familyOptions = COLOR_FAMILIES.filter((f) => familyCounts.get(f.id));
  const showFamilyFilter = vehicle.colors.length > FILTER_FROM && familyOptions.length > 1;
  const trackInfo = { slug: vehicle.slug, colorId: activeColor.id };

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
            <CopyHex hexes={activeHexes} format={fmt} onFormatChange={setFmt} track={trackInfo} />

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

            {showFamilyFilter && (
              <div className="flex items-center gap-1.5 flex-wrap mb-3" role="group" aria-label="Фильтр по оттенку">
                <button
                  type="button"
                  onClick={() => setFamily("")}
                  aria-pressed={!family}
                  className={`rounded-full border px-2.5 py-1 font-body text-[11px] transition-colors ${
                    !family ? "border-signal/50 bg-signal/10 text-signal" : "border-hair bg-raised text-ink hover:border-mute"
                  }`}
                >
                  Все
                </button>
                {familyOptions.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFamily(family === f.id ? "" : f.id)}
                    aria-pressed={family === f.id}
                    className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-body text-[11px] transition-colors ${
                      family === f.id ? "border-signal/50 bg-signal/10 text-signal" : "border-hair bg-raised text-ink hover:border-mute"
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full border border-hair/80" style={{ background: f.sample }} />
                    {f.label}
                    <span className="font-mono text-[10px] text-mute">{familyCounts.get(f.id)}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {shownColors.map((color) => (
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
          <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} style={{ touchAction: "pan-y" }}>
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
          {shownColors.length > 1 && (
            <p className="font-body text-[11px] text-mute mt-2">
              Цвета можно листать стрелками ← → на клавиатуре или свайпом по фото.
            </p>
          )}
        </div>
      </div>

      {(neighbours.prev || neighbours.next) && (
        <nav
          aria-label="Соседние машины категории"
          className="mt-12 pt-6 border-t border-hair flex items-center justify-between gap-4"
        >
          {neighbours.prev ? (
            <Link
              to={`/vehicle/${neighbours.prev.slug}`}
              className="group flex items-center gap-2 min-w-0 font-body text-sm text-mute hover:text-signal transition-colors"
            >
              <ChevronLeft size={18} className="shrink-0" />
              <span className="min-w-0">
                <span className="block text-[11px] uppercase tracking-[0.15em]">Предыдущая</span>
                <span className="block font-display text-base tracking-wide text-ink group-hover:text-signal truncate">
                  {neighbours.prev.name}
                </span>
              </span>
            </Link>
          ) : (
            <span />
          )}
          <span className="font-mono text-xs text-mute shrink-0">
            {neighbours.index + 1} из {neighbours.total}
          </span>
          {neighbours.next ? (
            <Link
              to={`/vehicle/${neighbours.next.slug}`}
              className="group flex items-center gap-2 min-w-0 text-right font-body text-sm text-mute hover:text-signal transition-colors"
            >
              <span className="min-w-0">
                <span className="block text-[11px] uppercase tracking-[0.15em]">Следующая</span>
                <span className="block font-display text-base tracking-wide text-ink group-hover:text-signal truncate">
                  {neighbours.next.name}
                </span>
              </span>
              <ChevronRight size={18} className="shrink-0" />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
