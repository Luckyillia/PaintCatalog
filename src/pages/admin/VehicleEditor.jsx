import { useEffect, useState } from "react";
import { Search, Loader2, Trash2, ArrowLeft, RefreshCw } from "lucide-react";
import { adminFetchVehicles, adminDeleteVehicle, clearVehiclesCache } from "../../data/vehicles";
import VehicleForm from "../../components/admin/VehicleForm";
import { formatRelativeTime } from "../../lib/textUtils";

export default function VehicleEditor() {
  const [vehicles, setVehicles] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedSlug, setSelectedSlug] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  function reload(forceRefresh = false) {
    setError("");
    adminFetchVehicles(forceRefresh)
      .then(setVehicles)
      .catch((err) => setError(err.message));
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const fresh = await adminFetchVehicles(true);
      setVehicles(fresh);
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  const selected = vehicles?.find((v) => v.slug === selectedSlug) || null;

  const filtered = (vehicles || []).filter((v) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return v.name.toLowerCase().includes(q) || v.slug.toLowerCase().includes(q);
  });

  async function handleDelete(vehicle) {
    if (!confirm(`Удалить машину «${vehicle.name}»? Это необратимо.`)) return;
    setDeleting(true);
    try {
      await adminDeleteVehicle(vehicle.slug);
      clearVehiclesCache();
      setSelectedSlug(null);
      reload();
    } catch (err) {
      alert("Ошибка удаления: " + err.message);
    } finally {
      setDeleting(false);
    }
  }

  if (selected) {
    return (
      <div>
        <button
          onClick={() => setSelectedSlug(null)}
          className="flex items-center gap-1.5 font-body text-sm text-mute hover:text-signal transition-colors mb-4"
        >
          <ArrowLeft size={15} />
          К списку машин
        </button>

        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <h1 className="font-display text-2xl tracking-wide text-ink">{selected.name}</h1>
          <button
            onClick={() => handleDelete(selected)}
            disabled={deleting}
            className="flex items-center gap-1.5 rounded-md border border-hair bg-raised text-amber font-body text-xs px-3 py-2 hover:border-amber/50 transition-colors disabled:opacity-50"
          >
            <Trash2 size={13} />
            Удалить машину
          </button>
        </div>

        <VehicleForm key={selected.slug} initial={selected} onSaved={reload} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <h1 className="font-display text-2xl tracking-wide text-ink">Редактировать машины</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-md border border-hair bg-raised text-mute font-body text-xs px-3 py-2 hover:border-signal/50 hover:text-signal transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          Обновить список
        </button>
      </div>

      <div className="relative mb-5">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-mute pointer-events-none"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по названию или slug..."
          className="w-full bg-raised border border-hair rounded-md pl-9 pr-3 py-2.5 font-body text-sm text-ink placeholder:text-mute focus:outline-none focus:border-signal/50 transition-colors"
        />
      </div>

      {error && <p className="font-body text-sm text-amber mb-4">Ошибка загрузки: {error}</p>}

      {!vehicles && !error && (
        <div className="flex items-center gap-2 font-body text-sm text-mute">
          <Loader2 size={16} className="animate-spin" />
          Загружаю...
        </div>
      )}

      {vehicles && (
        <div className="flex flex-col gap-2">
          {filtered.map((v) => (
            <button
              key={v.slug}
              onClick={() => setSelectedSlug(v.slug)}
              className="flex items-center justify-between gap-3 border border-hair rounded-md bg-panel px-4 py-3 text-left hover:border-signal/50 transition-colors"
            >
              <div>
                <p className="font-display text-sm tracking-wide text-ink">{v.name}</p>
                <p className="font-mono text-[11px] text-mute mt-0.5">
                  {v.slug} · {v.category} · {v.colors.length} цветов
                  {v.editedBy && (
                    <> · правил: {v.editedBy}{v.editedAt ? `, ${formatRelativeTime(v.editedAt)}` : ""}</>
                  )}
                </p>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="font-body text-sm text-mute">Ничего не найдено.</p>
          )}
        </div>
      )}
    </div>
  );
}
