import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, ExternalLink, Check, X, RotateCcw, Trash2 } from "lucide-react";
import { adminFetch, adminDb } from "../../lib/adminApi";
import { notifyReportsChanged } from "../../lib/adminEvents";
import { formatRelativeTime } from "../../lib/textUtils";
import { RowsSkeleton } from "../../components/Skeleton";

const TABS = [
  { id: "new", label: "Новые" },
  { id: "accepted", label: "Принятые" },
  { id: "rejected", label: "Отклонённые" },
  { id: "all", label: "Все" },
];
const KIND_LABEL = { color_error: "Ошибка в цвете", new_vehicle: "Новая машина" };

function Field({ title, children }) {
  if (!children) return null;
  return (
    <div>
      <p className="font-body text-[11px] uppercase tracking-[0.1em] text-mute mb-0.5">{title}</p>
      <p className="font-body text-sm text-ink whitespace-pre-wrap break-words">{children}</p>
    </div>
  );
}

function ReportCard({ report, busy, onStatus, onDelete }) {
  const isColor = report.kind === "color_error";
  const slug = report.vehicle_slug ? encodeURIComponent(report.vehicle_slug) : "";
  const publicHref = slug
    ? `/vehicle/${slug}${report.color_id ? `?color=${encodeURIComponent(report.color_id)}` : ""}`
    : "";

  const btn =
    "flex items-center gap-1 rounded-md border border-hair bg-raised px-3 py-1.5 font-body text-xs transition-colors disabled:opacity-50";

  return (
    <div className="border border-hair rounded-lg bg-panel p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className={`font-mono text-[11px] uppercase tracking-wide px-2 py-0.5 rounded border ${
            isColor ? "border-amber/50 text-amber" : "border-signal/40 text-signal"
          }`}
        >
          {KIND_LABEL[report.kind] || report.kind}
        </span>
        <span className="font-mono text-[11px] text-mute" title={report.created_at}>
          {formatRelativeTime(report.created_at)}
        </span>
        {report.status !== "new" && (
          <span className="font-mono text-[11px] text-mute">
            {report.status === "accepted" ? "принято" : "отклонено"}
            {report.edited_by ? `: ${report.edited_by}` : ""}
          </span>
        )}
      </div>

      {isColor ? (
        <Field title="Машина и цвет">
          {report.vehicle_slug}
          {report.color_id ? ` / ${report.color_id}` : ""}
        </Field>
      ) : (
        <>
          <Field title="Название">{report.payload?.name}</Field>
          <Field title="Категория">{report.payload?.category}</Field>
          <Field title="Цвета">{report.payload?.colors}</Field>
        </>
      )}
      <Field title="Сообщение">{report.message}</Field>
      <Field title="Контакт">{report.contact}</Field>

      <div className="flex items-center gap-2 flex-wrap">
        {report.status !== "accepted" && (
          <button type="button" disabled={busy} onClick={() => onStatus(report, "accepted")} className={`${btn} text-signal hover:border-signal/50`}>
            <Check size={13} />
            Принять
          </button>
        )}
        {report.status !== "rejected" && (
          <button type="button" disabled={busy} onClick={() => onStatus(report, "rejected")} className={`${btn} text-mute hover:border-amber/50 hover:text-amber`}>
            <X size={13} />
            Отклонить
          </button>
        )}
        {report.status !== "new" && (
          <button type="button" disabled={busy} onClick={() => onStatus(report, "new")} className={`${btn} text-mute hover:border-mute`}>
            <RotateCcw size={13} />
            Вернуть в новые
          </button>
        )}

        {isColor && slug && (
          <>
            <Link to={`/admin/vehicle-editor?slug=${slug}`} className={`${btn} text-ink hover:border-signal/50 hover:text-signal`}>
              Открыть в редакторе
            </Link>
            <a href={publicHref} target="_blank" rel="noopener noreferrer" className={`${btn} text-ink hover:border-signal/50 hover:text-signal`}>
              <ExternalLink size={13} />
              На сайте
            </a>
          </>
        )}
        {!isColor && (
          <Link to="/admin/vehicle-constructor" className={`${btn} text-ink hover:border-signal/50 hover:text-signal`}>
            Добавить машину
          </Link>
        )}

        <button type="button" disabled={busy} onClick={() => onDelete(report)} className={`${btn} ml-auto text-mute hover:border-amber/50 hover:text-amber`}>
          <Trash2 size={13} />
          Удалить
        </button>
      </div>
    </div>
  );
}

export default function ReportsQueue() {
  const [tab, setTab] = useState("new");
  const [nonce, setNonce] = useState(0);
  const [rows, setRows] = useState(null);
  const [counts, setCounts] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError("");
    adminFetch("/api/admin-reports", { status: tab === "all" ? undefined : tab, limit: 200 })
      .then((json) => {
        if (cancelled) return;
        setRows(json.data || []);
        setCounts(json.counts || null);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, nonce]);

  function refresh() {
    setNonce((n) => n + 1);
    notifyReportsChanged();
  }

  async function handleStatus(report, status) {
    setBusyId(report.id);
    try {
      await adminDb("reports", "update", { keyValue: report.id, patch: { status } });
      refresh();
    } catch (err) {
      alert("Ошибка: " + err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(report) {
    if (!confirm("Удалить это сообщение насовсем?")) return;
    setBusyId(report.id);
    try {
      await adminDb("reports", "delete", { keyValue: report.id });
      refresh();
    } catch (err) {
      alert("Ошибка удаления: " + err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <h1 className="font-display text-2xl tracking-wide text-ink">Репорты</h1>
        <button
          type="button"
          onClick={() => setNonce((n) => n + 1)}
          className="flex items-center gap-1.5 rounded-md border border-hair bg-raised text-mute font-body text-xs px-3 py-2 hover:border-signal/50 hover:text-signal transition-colors"
        >
          <RefreshCw size={13} />
          Обновить
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-5" role="tablist">
        {TABS.map((t) => {
          const n = t.id === "all" ? null : counts?.[t.id];
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-md border px-3 py-1.5 font-body text-sm transition-colors ${
                tab === t.id ? "border-signal/40 bg-signal/15 text-signal" : "border-hair bg-raised text-mute hover:text-ink"
              }`}
            >
              {t.label}
              {n !== null && n !== undefined && <span className="font-mono text-[11px] ml-1.5">{n}</span>}
            </button>
          );
        })}
      </div>

      {error && <p className="font-body text-sm text-amber mb-4">Ошибка загрузки: {error}</p>}

      {!rows && !error && <RowsSkeleton count={3} className="h-32" />}

      {rows && rows.length === 0 && <p className="font-body text-sm text-mute">Здесь пусто.</p>}

      {rows && (
        <div className="flex flex-col gap-3">
          {rows.map((r) => (
            <ReportCard key={r.id} report={r} busy={busyId === r.id} onStatus={handleStatus} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
