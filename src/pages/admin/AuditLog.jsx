import { useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { adminFetch } from "../../lib/adminApi";
import { formatRelativeTime } from "../../lib/textUtils";

const TABLES = ["", "vehicles", "tags", "tag_groups", "credit_groups", "credit_entries"];
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
          {rows.map((r) => (
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
                <div className="flex gap-3 flex-wrap px-4 pb-4">
                  <Json title="Было" data={r.old_data} />
                  <Json title="Стало" data={r.new_data} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
