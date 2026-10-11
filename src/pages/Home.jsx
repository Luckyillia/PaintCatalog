import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Pipette, Shuffle } from "lucide-react";
import { categories } from "../data/categories";
import { useVehiclesContext } from "../context/VehiclesContext";
import CategoryCard from "../components/CategoryCard";
import VehicleCard from "../components/VehicleCard";
import ReportButton from "../components/ReportButton";
import PopularBlock from "../components/PopularBlock";

const RECENT_DAYS = 30;
const RECENT_LIMIT = 6;

export default function Home() {
  const navigate = useNavigate();
  const { vehicles } = useVehiclesContext();
  const [now] = useState(() => Date.now());

  // «Новое» — только то, что реально добавлено недавно; если таких нет,
  // блок не показываем (чтобы не выдавать старое за новое)
  const recent = useMemo(() => {
    const limit = now - RECENT_DAYS * 86400000;
    return vehicles
      .filter((v) => v.createdAt && new Date(v.createdAt).getTime() > limit)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, RECENT_LIMIT);
  }, [vehicles, now]);

  function goRandom() {
    if (vehicles.length === 0) return;
    const v = vehicles[Math.floor(Math.random() * vehicles.length)];
    navigate(`/vehicle/${v.slug}`);
  }

  const secondary =
    "flex items-center gap-1.5 rounded-md border border-hair bg-raised px-3 py-2 font-body text-xs text-ink hover:border-signal/50 hover:text-signal transition-colors";

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">
      <section className="mb-12 border border-hair rounded-lg bg-panel bg-shutter px-6 py-6 text-center">
        <img
          src="/images/logo.png"
          alt="OSNOVA"
          className="h-36 sm:h-36 w-auto mx-auto mb-4"
        />
        <h1 className="font-display text-4xl sm:text-5xl tracking-wide text-ink mt-1">
          Стоковые цвета транспорта
        </h1>
        <p className="font-body text-mute mt-4 max-w-xl mx-auto">
          Выбери категорию транспорта, затем конкретную машину — увидишь все
          заводские варианты окраски с точными hex-кодами.
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap mt-5">
          <Link to="/color-search" className={secondary}>
            <Pipette size={14} />
            Найти по цвету
          </Link>
          <button type="button" onClick={goRandom} disabled={vehicles.length === 0} className={`${secondary} disabled:opacity-40`}>
            <Shuffle size={14} />
            Случайная машина
          </button>
        </div>
      </section>

      <h2 className="font-display text-2xl tracking-wide text-ink mb-4">
        Категории
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <CategoryCard key={cat.slug} category={cat} />
        ))}
      </div>

      <PopularBlock />

      {recent.length > 0 && (
        <>
          <h2 className="font-display text-2xl tracking-wide text-ink mt-12 mb-4 flex items-center gap-3">
            Новые машины
            <span className="flex-1 h-px bg-hair" />
            <span className="font-body text-xs text-mute">за {RECENT_DAYS} дней</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recent.map((v) => (
              <VehicleCard key={v.slug} vehicle={v} />
            ))}
          </div>
        </>
      )}

      <div className="mt-12 border border-dashed border-hair rounded-lg px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
        <p className="font-body text-sm text-mute max-w-md">
          Не нашёл свою машину в каталоге? Напиши, какой не хватает — добавим.
        </p>
        <ReportButton kind="new_vehicle" label="Предложить машину" />
      </div>
    </div>
  );
}
