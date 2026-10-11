import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Undo2 } from "lucide-react";
import { adminFetch, adminDb } from "../../lib/adminApi";
import { formatRelativeTime } from "../../lib/textUtils";
import { planRollback } from "../../lib/auditRollback";
import { clearVehiclesCache } from "../../data/vehicles";
import { clearTagsCache } from "../../data/tags";

const TABLES = ["", "vehicles", "tags", "tag_groups", "credit_groups", "credit_entries", "reports"];
const ACTION_LABEL = { insert: "создание", upsert: "сохранение", update: "правка", delete: "удаление" };

function Json({ title, data }) {
  if (data == null) return null;
  const text = JSON.stringify(data, null, 2);
  return (
    <div className="min-w-0 flex-1">
      <p className="font-body text-[11px] uppercase tracking-[0.1em] text-mute mb-1">{title}</p>
      <pre className="font-mono text-[11px] text-ink bg-raised2 border border-hair rounded p-2 overflow-auto max-h-64">
        {text.length > 4000 ? text.slice(0, 4000) + "\n…" : text}
      </pre>
    </div>
  );
}

export default function AuditLog() {
  const [table, setTable] = useState("");
  const [nonce, setNonce] = useState(0);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);
  const [rollingBack, setRollingBack] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError("");
    adminFetch("/api/admin-audit", { table: table || undefined, limit: 150 })
      .then((json) => {
        if (!cancelled) setRows(json.data || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [table, nonce]);

  async function handleRollback(row) {
    const plan = planRollback(row);
    if (!plan || !confirm(plan.confirm)) return;
    setRollingBack(row.id);
    try {
      await adminDb(plan.table, plan.action, plan.params);
      // сайт и формы должны подхватить откат без перезагрузки страницы
      if (plan.table === "vehicles") clearVehiclesCache();
      if (plan.table === "tags" || plan.table === "tag_groups") clearTagsCache();
      setNonce((n) => n + 1);
    } catch (err) {
      alert("Не удалось откатить: " + err.message);
    } finally {
      setRollingBack(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <h1 className="font-display text-2xl tracking-wide text-ink">Журнал изменений</h1>
        <div className="flex items-center gap-2">
          <select
            value={table}
            onChange={(e) => setTable(e.target.value)}
            className="bg-raised border border-hair rounded px-3 py-2 font-body text-xs text-ink focus:outline-none focus:border-signal/50"
          >
            {TABLES.map((t) => (
              <option key={t} value={t}>
                {t || "Все таблицы"}
              </option>
            ))}
          </select>
          <button
            onClick={() => setNonce((n) => n + 1)}
            className="flex items-center gap-1.5 rounded-md border border-hair bg-raised text-mute font-body text-xs px-3 py-2 hover:border-signal/50 hover:text-signal transition-colors"
          >
            <RefreshCw size={13} />
            Обновить
          </button>
        </div>
      </div>

      {error && (
        <p className="font-body text-sm text-amber mb-4">
          Ошибка загрузки: {error}. Если таблицы audit_log ещё нет — выполни sql/audit-log.sql в Supabase.
        </p>
      )}

      {!rows && !error && (
        <div className="flex items-center gap-2 font-body text-sm text-mute">
          <Loader2 size={16} className="animate-spin" />
          Загружаю...
        </div>
      )}

      {rows && rows.length === 0 && <p className="font-body text-sm text-mute">Записей пока нет.</p>}

      {rows && (
        <div className="flex flex-col gap-2">
          {rows.map((r) => {
            const canRollback = planRollback(r) !== null;
            return (
              <div key={r.id} className="border border-hair rounded-md bg-panel">
                <button
                  onClick={() => setOpenId(openId === r.id ? null : r.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left flex-wrap"
                >
                  <span className="font-mono text-[11px] text-signal uppercase w-20 shrink-0">
                    {ACTION_LABEL[r.action] || r.action}
                  </span>
                  <span className="font-display text-sm tracking-wide text-ink truncate flex-1 min-w-[140px]">
                    {r.table_name} · {r.row_key ?? "—"}
                  </span>
                  <span className="font-mono text-[11px] text-mute" title={r.created_at}>
                    {r.edited_by || "?"} · {formatRelativeTime(r.created_at)}
                  </span>
                </button>
                {openId === r.id && (
                  <div className="px-4 pb-4 flex flex-col gap-3">
                    <div className="flex gap-3 flex-wrap">
                      <Json title="Было" data={r.old_data} />
                      <Json title="Стало" data={r.new_data} />
                    </div>
                    {canRollback && (
                      <div>
                        <button
                          type="button"
                          onClick={() => handleRollback(r)}
                          disabled={rollingBack === r.id}
                          className="flex items-center gap-1.5 rounded-md border border-hair bg-raised text-ink font-body text-xs px-3 py-2 hover:border-signal/50 hover:text-signal transition-colors disabled:opacity-50"
                        >
                          {rollingBack === r.id ? <Loader2 size={13} className="animate-spin" /> : <Undo2 size={13} />}
                          Откатить это изменение
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
