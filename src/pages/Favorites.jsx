import { useMemo } from "react";
import { Heart, History, Trash2, Loader2 } from "lucide-react";
import { useFavorites } from "../context/FavoritesContext";
import { useVehiclesContext } from "../context/VehiclesContext";
import { getVehicle } from "../data/vehicles";
import Breadcrumbs from "../components/Breadcrumbs";
import VehicleCard from "../components/VehicleCard";

function Section({ icon: Icon, title, count, onClear, emptyText, vehicles }) {
  return (
    <div className="mb-12">
      <h2 className="font-display text-2xl tracking-wide text-ink mb-4 flex items-center gap-3">
        <Icon size={20} className="text-signal shrink-0" />
        {title}
        <span className="flex-1 h-px bg-hair" />
        <span className="font-mono text-xs text-mute">{count}</span>
        {count > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 font-body text-xs text-mute hover:text-amber transition-colors shrink-0"
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

export default function Favorites() {
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
        <span className="font-mono text-xs tracking-[0.2em] text-signal uppercase">
          Твой список
        </span>
        <h1 className="font-display text-4xl sm:text-5xl tracking-wide text-ink mt-3">
          Избранное
        </h1>
        <p className="font-body text-mute mt-4 max-w-xl mx-auto">
          Хранится прямо в этом браузере, без регистрации — удобно
          сравнивать несколько вариантов окраски, не держа их в голове.
        </p>
      </section>

      {loading ? (
        <div className="flex items-center gap-2 font-body text-sm text-mute">
          <Loader2 size={16} className="animate-spin" />
          Загружаю...
        </div>
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