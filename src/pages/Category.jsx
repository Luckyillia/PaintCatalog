import { useMemo } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { getCategory, getVehiclesByCategory, getVehiclesByTags, getUsedTagIds } from "../data/vehicles";
import { useVehiclesContext } from "../context/VehiclesContext";
import { useTagsContext } from "../context/TagsContext";
import { usePageTitle } from "../lib/usePageTitle";
import Breadcrumbs from "../components/Breadcrumbs";
import VehicleCard from "../components/VehicleCard";
import TagFilterBar from "../components/TagFilterBar";
import ReportButton from "../components/ReportButton";
import { VehicleGridSkeleton } from "../components/Skeleton";
import { Search } from "lucide-react";

// key={slug}: при переходе в другую категорию компонент пересоздаётся
// (а параметры ?q= и ?tags= в ссылке новой категории всё равно пустые).
export default function Category() {
  const { slug } = useParams();
  return <CategoryView key={slug} slug={slug} />;
}

function CategoryView({ slug }) {
  const category = getCategory(slug);
  usePageTitle(category?.name);
  const { vehicles, loading, error } = useVehiclesContext();
  const { tags } = useTagsContext();
  const [params, setParams] = useSearchParams();

  // поиск и выбранные теги живут в ссылке: ?q=bmw&tags=brand-bmw,era-2010s
  const query = params.get("q") ?? "";
  const tagsParam = params.get("tags") ?? "";
  const selectedTags = useMemo(() => tagsParam.split(",").filter(Boolean), [tagsParam]);

  function updateParam(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  const allVehicles = useMemo(() => getVehiclesByCategory(vehicles, slug), [vehicles, slug]);
  const availableTagIds = useMemo(() => getUsedTagIds(allVehicles, tags), [allVehicles, tags]);

  const vehiclesFiltered = useMemo(() => {
    let list = getVehiclesByTags(allVehicles, selectedTags);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((v) => v.name.toLowerCase().includes(q));
    return [...list].sort((a, b) => a.name.localeCompare(b.name, "ru"));
  }, [allVehicles, selectedTags, query]);

  if (!category) {
    return (
      <div className="max-w-6xl mx-auto px-5 py-10">
        <p className="font-body text-mute">
          Такой категории нет.{" "}
          <Link to="/" className="text-signal">
            Вернуться на главную
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">
      <Breadcrumbs items={[{ label: "Главная", to: "/" }, { label: category.name }]} />
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
        <h1 className="font-display text-3xl tracking-wide text-ink">{category.name}</h1>
        <ReportButton kind="new_vehicle" label="Предложить машину" />
      </div>

      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => updateParam("q", e.target.value)}
          placeholder="Поиск по названию..."
          className="w-full bg-raised border border-hair rounded-md pl-9 pr-3 py-2.5 font-body text-sm text-ink placeholder:text-mute focus:outline-none focus:border-signal/50 transition-colors"
        />
      </div>

      <TagFilterBar
        availableTagIds={availableTagIds}
        selected={selectedTags}
        onToggle={(next) => updateParam("tags", next.join(","))}
        onClear={() => updateParam("tags", "")}
      />

      {error && <p className="font-body text-sm text-amber mb-4">Ошибка загрузки: {error}</p>}

      {loading ? (
        <VehicleGridSkeleton />
      ) : allVehicles.length === 0 ? (
        <p className="font-body text-mute">В этой категории пока нет машин с заполненными данными.</p>
      ) : vehiclesFiltered.length === 0 ? (
        <p className="font-body text-mute">Ничего не найдено по заданным условиям.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehiclesFiltered.map((v) => (
            <VehicleCard key={v.slug} vehicle={v} />
          ))}
        </div>
      )}
    </div>
  );
}
