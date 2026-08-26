import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchProviderById, getProviderNote } from "../data/credits";
import { getVehicle } from "../data/vehicles";
import { useVehiclesContext } from "../context/VehiclesContext";
import Breadcrumbs from "../components/Breadcrumbs";
import VehicleCard from "../components/VehicleCard";
import { ExternalLink, Loader2 } from "lucide-react";

export default function ProviderDetail() {
  const { id } = useParams();
  // undefined = ещё грузится, null = загрузили и не нашли
  const [provider, setProvider] = useState(undefined);
  const [error, setError] = useState("");
  const { vehicles, loading: vehiclesLoading } = useVehiclesContext();

  useEffect(() => {
    let cancelled = false;
    setProvider(undefined);
    setError("");
    fetchProviderById(id)
      .then((data) => {
        if (!cancelled) setProvider(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-5 py-10">
        <p className="font-body text-amber">Ошибка загрузки: {error}</p>
      </div>
    );
  }

  if (provider === undefined || vehiclesLoading) {
    return (
      <div className="max-w-6xl mx-auto px-5 py-10 flex items-center gap-2 font-body text-sm text-mute">
        <Loader2 size={16} className="animate-spin" />
        Загружаю...
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="max-w-6xl mx-auto px-5 py-10">
        <p className="font-body text-mute">
          Такого поставщика нет.{" "}
          <Link to="/credits" className="text-signal">
            Вернуться на стену почёта
          </Link>
        </p>
      </div>
    );
  }

  const providerVehicles = (provider.vehicleSlugs ?? [])
    .map((slug) => getVehicle(vehicles, slug))
    .filter(Boolean);

  const note = getProviderNote(provider);

  const initials = provider.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">
      <Breadcrumbs
        items={[
          { label: "Главная", to: "/" },
          { label: "Стена почёта", to: "/credits" },
          { label: provider.name },
        ]}
      />

      <section className="mb-10 border border-hair rounded-lg bg-panel bg-shutter px-8 py-10 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
        {provider.avatar ? (
          <img
            src={provider.avatar}
            alt={provider.name}
            className="w-24 h-24 rounded-full object-cover border border-hair shrink-0"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-raised2 border border-hair flex items-center justify-center shrink-0">
            <span className="font-display text-3xl tracking-wide text-signal">
              {initials || "?"}
            </span>
          </div>
        )}

        <div className="flex-1">
          <span className="font-mono text-xs tracking-[0.2em] text-signal uppercase">
            {provider.role}
          </span>
          <h1 className="font-display text-3xl sm:text-4xl tracking-wide text-ink mt-1">
            {provider.name}
          </h1>
          {note && <p className="font-body text-mute mt-2">{note}</p>}
        </div>

        {provider.link && (
          <a
            href={provider.link}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2 rounded-md border border-hair bg-raised px-4 py-2.5 font-body text-sm text-ink hover:border-signal/50 hover:text-signal transition-colors"
          >
            <ExternalLink size={16} />
            Контакты
          </a>
        )}
      </section>

      <h2 className="font-display text-2xl tracking-wide text-ink mb-4 flex items-center gap-3">
        Предоставленные машины
        <span className="flex-1 h-px bg-hair" />
        <span className="font-mono text-xs text-mute">{providerVehicles.length}</span>
      </h2>

      {providerVehicles.length === 0 ? (
        <p className="font-body text-mute">
          Машины пока не привязаны к этому профилю.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {providerVehicles.map((v) => (
            <VehicleCard key={v.slug} vehicle={v} />
          ))}
        </div>
      )}
    </div>
  );
}
