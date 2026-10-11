import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, PenSquare, Tags, Award, ArrowRight, History, Inbox, Upload, Trash2, CheckCircle2 } from "lucide-react";
import { adminFetchVehicles } from "../../data/vehicles";
import { analyzeCatalog } from "../../lib/catalogHealth";
import { RowsSkeleton } from "../../components/Skeleton";

const CARDS = [
  {
    to: "/admin/vehicle-constructor",
    icon: PlusCircle,
    title: "Добавить машину",
    desc: "Новая карточка транспорта: категория, цвета, фото, теги.",
  },
  {
    to: "/admin/vehicle-editor",
    icon: PenSquare,
    title: "Редактировать машины",
    desc: "Найти существующую машину, изменить или скопировать её.",
  },
  {
    to: "/admin/vehicle-import",
    icon: Upload,
    title: "Массовый импорт",
    desc: "Загрузить много машин сразу из JSON или CSV (Excel).",
  },
  {
    to: "/admin/tags",
    icon: Tags,
    title: "Теги и группы",
    desc: "Создать, переименовать, перекрасить или удалить теги и группы.",
  },
  {
    to: "/admin/credits",
    icon: Award,
    title: "Стена почёта",
    desc: "Блоки и записи благодарностей.",
  },
  {
    to: "/admin/reports",
    icon: Inbox,
    title: "Репорты",
    desc: "Ошибки в цветах и предложения новых машин от посетителей.",
  },
  {
    to: "/admin/trash",
    icon: Trash2,
    title: "Корзина",
    desc: "Удалённые записи хранятся 30 дней — отсюда их можно вернуть.",
  },
  {
    to: "/admin/audit",
    icon: History,
    title: "Журнал изменений",
    desc: "Кто, что и когда менял — со значениями «было / стало» и откатом.",
  },
];

const SHOW_LIMIT = 40;

function IssueList({ title, hint, items }) {
  if (items.length === 0) return null;
  return (
    <details className="border border-hair rounded-md bg-raised">
      <summary className="cursor-pointer select-none flex items-center justify-between gap-3 px-4 py-3 font-body text-sm text-ink hover:text-signal transition-colors">
        <span>
          {title}
          <span className="block font-body text-[11px] text-mute">{hint}</span>
        </span>
        <span className="font-mono text-xs text-amber shrink-0">{items.length}</span>
      </summary>
      <div className="px-4 pb-3 flex flex-col gap-1">
        {items.slice(0, SHOW_LIMIT).map((it) => (
          <Link
            key={it.vehicle.slug}
            to={`/admin/vehicle-editor?slug=${encodeURIComponent(it.vehicle.slug)}`}
            className="flex items-center justify-between gap-3 rounded px-2 py-1.5 hover:bg-raised2 transition-colors"
          >
            <span className="font-body text-sm text-ink truncate">{it.vehicle.name}</span>
            {it.note && <span className="font-mono text-[11px] text-mute shrink-0 truncate max-w-[55%]">{it.note}</span>}
          </Link>
        ))}
        {items.length > SHOW_LIMIT && (
          <p className="font-body text-[11px] text-mute px-2 pt-1">…и ещё {items.length - SHOW_LIMIT}</p>
        )}
      </div>
    </details>
  );
}

function HealthPanel() {
  const [vehicles, setVehicles] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    adminFetchVehicles()
      .then((rows) => {
        if (!cancelled) setVehicles(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const report = useMemo(() => (vehicles ? analyzeCatalog(vehicles) : null), [vehicles]);

  return (
    <section className="mt-10">
      <h2 className="font-display text-xl tracking-wide text-ink mb-1">Здоровье каталога</h2>
      <p className="font-body text-xs text-mute mb-4">Что ещё стоит дозаполнить. Нажми на пункт, чтобы увидеть машины.</p>

      {error && <p className="font-body text-sm text-amber">Ошибка загрузки: {error}</p>}
      {!report && !error && <RowsSkeleton count={3} className="h-12" />}

      {report && report.issues === 0 && (
        <p className="flex items-center gap-2 font-body text-sm text-signal">
          <CheckCircle2 size={16} />
          Всё заполнено ({report.total} машин).
        </p>
      )}

      {report && report.issues > 0 && (
        <div className="flex flex-col gap-2">
          <IssueList
            title="Без обложки"
            hint="Карточка в списке показывает заглушку"
            items={report.noCover.map((vehicle) => ({ vehicle }))}
          />
          <IssueList
            title="Без цветов"
            hint="Страница машины пустая"
            items={report.noColors.map((vehicle) => ({ vehicle }))}
          />
          <IssueList
            title="Цвета без скриншота из игры"
            hint="У части окрасок нет фото"
            items={report.colorsNoPhoto.map(({ vehicle, count, total }) => ({ vehicle, note: `${count} из ${total}` }))}
          />
          <IssueList
            title="Одинаковый hex внутри машины"
            hint="Возможно, окраска продублирована"
            items={report.duplicateHex.map(({ vehicle, groups }) => ({
              vehicle,
              note: groups.map((g) => g.names.join(" = ")).join("; "),
            }))}
          />
          <IssueList
            title="Без тегов"
            hint="Машину не найти через фильтры"
            items={report.noTags.map((vehicle) => ({ vehicle }))}
          />
        </div>
      )}
    </section>
  );
}

export default function AdminHome() {
  return (
    <div>
      <h1 className="font-display text-2xl tracking-wide text-ink mb-6">Что делаем?</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CARDS.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="group flex items-start gap-4 rounded-lg border border-hair bg-panel p-5 hover:border-signal/50 transition-colors"
          >
            <span className="w-10 h-10 rounded-md bg-signal/15 border border-signal/40 flex items-center justify-center text-signal shrink-0">
              <card.icon size={18} />
            </span>
            <div className="flex-1">
              <h2 className="font-display text-lg tracking-wide text-ink group-hover:text-signal transition-colors">
                {card.title}
              </h2>
              <p className="font-body text-xs text-mute mt-1">{card.desc}</p>
            </div>
            <ArrowRight size={16} className="text-mute group-hover:text-signal transition-colors shrink-0 mt-2" />
          </Link>
        ))}
      </div>

      <HealthPanel />
    </div>
  );
}
