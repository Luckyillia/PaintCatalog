import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Heart, History, Trash2, Palette } from "lucide-react";
import { useFavorites } from "../context/FavoritesContext";
import { useVehiclesContext } from "../context/VehiclesContext";
import { getVehicle, getColorHexes } from "../data/vehicles";
import { usePageTitle } from "../lib/usePageTitle";
import Breadcrumbs from "../components/Breadcrumbs";
import VehicleCard from "../components/VehicleCard";
import { VehicleGridSkeleton } from "../components/Skeleton";

function Section({ icon: Icon, title, count, onClear, emptyText, vehicles }) {
  return (
    <div className="mb-12">
      <h2 className="font-display text-xl sm:text-2xl tracking-wide text-ink mb-4 flex items-center gap-x-3 gap-y-1 flex-wrap">
        <Icon size={20} className="text-signal shrink-0" />
        {title}
        <span className="hidden sm:block flex-1 h-px bg-hair" />
        <span className="font-mono text-xs text-mute">{count}</span>
        {count > 0 && (
          <button
            onClick={onClear}
            className="ml-auto sm:ml-0 flex items-center gap-1 font-body text-xs text-mute hover:text-amber transition-colors shrink-0 py-2"
          >
            <Trash2 size={13} />
            Очистить
          </button>
        )}
      </h2>

      {vehicles.length === 0 ? (
        <p className="font-body text-mute">{emptyText}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <VehicleCard key={v.slug} vehicle={v} />
          ))}
        </div>
      )}
    </div>
  );
}

// Сравнение: палитры всех избранных машин рядом друг с другом.
function Palettes({ vehicles }) {
  if (vehicles.length === 0) return null;
  return (
    <div className="mb-12">
      <h2 className="font-display text-xl sm:text-2xl tracking-wide text-ink mb-4 flex items-center gap-3">
        <Palette size={20} className="text-signal shrink-0" />
        Палитры избранного
        <span className="flex-1 h-px bg-hair" />
      </h2>
      <div className="flex flex-col gap-4">
        {vehicles.map((v) => (
          <div key={v.slug} className="rounded-lg border border-hair bg-panel p-4">
            <Link
              to={`/vehicle/${v.slug}`}
              className="font-display text-lg tracking-wide text-ink hover:text-signal transition-colors"
            >
              {v.name}
            </Link>
            <div className="flex flex-wrap gap-3 mt-3">
              {v.colors.map((c) => {
                const hexes = getColorHexes(c);
                const bg =
                  hexes.length > 1 ? `linear-gradient(135deg, ${hexes[0]} 50%, ${hexes[1]} 50%)` : hexes[0];
                return (
                  <Link
                    key={c.id}
                    to={`/vehicle/${v.slug}?color=${encodeURIComponent(c.id)}`}
                    title={c.name}
                    className="w-24"
                  >
                    <span className="block h-10 rounded-md border border-hair shadow-chip" style={{ background: bg }} />
                    <span className="block font-body text-[10px] text-ink mt-1 truncate">{c.name}</span>
                    <span className="block font-mono text-[10px] text-mute truncate">{hexes.join(" / ")}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Favorites() {
  usePageTitle("Избранное");
  const { favorites, recent, clearFavorites, clearRecent } = useFavorites();
  const { vehicles, loading } = useVehiclesContext();

  const favoriteVehicles = useMemo(
    () => favorites.map((slug) => getVehicle(vehicles, slug)).filter(Boolean),
    [favorites, vehicles]
  );
  const recentVehicles = useMemo(
    () => recent.map((slug) => getVehicle(vehicles, slug)).filter(Boolean),
    [recent, vehicles]
  );

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">
      <Breadcrumbs items={[{ label: "Главная", to: "/" }, { label: "Избранное" }]} />

      <section className="mb-12 border border-hair rounded-lg bg-panel bg-shutter px-8 py-10 text-center">
        <span className="w-12 h-12 mx-auto rounded-md bg-signal/15 border border-signal/40 flex items-center justify-center text-signal mb-4">
          <Heart size={22} strokeWidth={2} />
        </span>
        <span className="font-mono text-xs tracking-[0.2em] text-signal uppercase">Твой список</span>
        <h1 className="font-display text-4xl sm:text-5xl tracking-wide text-ink mt-3">Избранное</h1>
        <p className="font-body text-mute mt-4 max-w-xl mx-auto">
          Хранится прямо в этом браузере, без регистрации — удобно сравнивать несколько вариантов окраски, не
          держа их в голове.
        </p>
      </section>

      {loading ? (
        <VehicleGridSkeleton count={3} />
      ) : (
        <>
          <Section
            icon={Heart}
            title="Избранное"
            count={favoriteVehicles.length}
            onClear={clearFavorites}
            emptyText="Пока пусто. Нажми на сердечко на карточке машины, чтобы добавить её сюда."
            vehicles={favoriteVehicles}
          />
          <Palettes vehicles={favoriteVehicles} />
          <Section
            icon={History}
            title="Недавно просмотренные"
            count={recentVehicles.length}
            onClear={clearRecent}
            emptyText="Здесь появятся машины, которые ты недавно открывал."
            vehicles={recentVehicles}
          />
        </>
      )}
    </div>
  );
}
