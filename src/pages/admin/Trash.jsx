import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Undo2, Trash2 } from "lucide-react";
import { adminFetch, adminDb } from "../../lib/adminApi";
import { planRollback } from "../../lib/auditRollback";
import { clearVehiclesCache } from "../../data/vehicles";
import { clearTagsCache } from "../../data/tags";
import { formatRelativeTime } from "../../lib/textUtils";
import { RowsSkeleton } from "../../components/Skeleton";

function titleOf(row) {
  const d = row.data || {};
  return d.name || d.title || d.label || row.row_key || "—";
}

export default function Trash() {
  const [rows, setRows] = useState(null);
  const [keepDays, setKeepDays] = useState(30);
  const [error, setError] = useState("");
  const [nonce, setNonce] = useState(0);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError("");
    adminFetch("/api/admin-trash", { action: "list" })
      .then((json) => {
        if (cancelled) return;
        setRows(json.data || []);
        if (json.keepDays) setKeepDays(json.keepDays);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  async function handleRestore(row) {
    const plan = planRollback({ table_name: row.table_name, action: "delete", row_key: row.row_key, old_data: row.data });
    if (!plan) {
      alert("Эту запись нельзя восстановить автоматически.");
      return;
    }
    if (!confirm(`Восстановить «${titleOf(row)}»? Если запись с таким ключом уже есть, она будет перезаписана.`)) return;
    setBusyId(row.id);
    try {
      await adminDb(plan.table, plan.action, plan.params);
      await adminFetch("/api/admin-trash", { action: "purge", id: row.id });
      if (plan.table === "vehicles") clearVehiclesCache();
      if (plan.table === "tags" || plan.table === "tag_groups") clearTagsCache();
      setNonce((n) => n + 1);
    } catch (err) {
      alert("Не удалось восстановить: " + err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handlePurge(row) {
    if (!confirm(`Удалить «${titleOf(row)}» навсегда? Вернуть будет нельзя.`)) return;
    setBusyId(row.id);
    try {
      await adminFetch("/api/admin-trash", { action: "purge", id: row.id });
      setNonce((n) => n + 1);
    } catch (err) {
      alert("Ошибка: " + err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleEmpty() {
    if (!confirm("Очистить корзину насовсем? Вернуть записи будет нельзя.")) return;
    try {
      await adminFetch("/api/admin-trash", { action: "empty" });
      setNonce((n) => n + 1);
    } catch (err) {
      alert("Ошибка: " + err.message);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
        <h1 className="font-display text-2xl tracking-wide text-ink">Корзина</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setNonce((n) => n + 1)}
            className="flex items-center gap-1.5 rounded-md border border-hair bg-raised text-mute font-body text-xs px-3 py-2 hover:border-signal/50 hover:text-signal transition-colors"
          >
            <RefreshCw size={13} />
            Обновить
          </button>
          {rows && rows.length > 0 && (
            <button
              type="button"
              onClick={handleEmpty}
              className="flex items-center gap-1.5 rounded-md border border-hair bg-raised text-mute font-body text-xs px-3 py-2 hover:border-amber/50 hover:text-amber transition-colors"
            >
              <Trash2 size={13} />
              Очистить
            </button>
          )}
        </div>
      </div>
      <p className="font-body text-xs text-mute mb-6">
        Здесь лежат удалённые машины, теги и записи стены почёта. Через {keepDays} дней они стираются сами.
      </p>

      {error && (
        <p className="font-body text-sm text-amber mb-4">
          Ошибка загрузки: {error}
        </p>
      )}

      {!rows && !error && <RowsSkeleton count={4} className="h-14" />}
      {rows && rows.length === 0 && <p className="font-body text-sm text-mute">Корзина пуста.</p>}

      {rows && (
        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center gap-3 border border-hair rounded-md bg-panel px-4 py-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm tracking-wide text-ink truncate">{titleOf(row)}</p>
                <p className="font-mono text-[11px] text-mute mt-0.5" title={row.deleted_at}>
                  {row.table_name} · {row.row_key ?? "—"} · удалил: {row.deleted_by || "?"}, {formatRelativeTime(row.deleted_at)}
                </p>
              </div>
              <button
                type="button"
                disabled={busyId === row.id}
                onClick={() => handleRestore(row)}
                className="flex items-center gap-1.5 rounded-md border border-hair bg-raised text-ink font-body text-xs px-3 py-2 hover:border-signal/50 hover:text-signal transition-colors disabled:opacity-50"
              >
                {busyId === row.id ? <Loader2 size={13} className="animate-spin" /> : <Undo2 size={13} />}
                Восстановить
              </button>
              <button
                type="button"
                disabled={busyId === row.id}
                onClick={() => handlePurge(row)}
                className="flex items-center gap-1.5 font-body text-xs text-mute hover:text-amber transition-colors disabled:opacity-50"
              >
                <Trash2 size={13} />
                Навсегда
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
