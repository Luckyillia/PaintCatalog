import { Link } from "react-router-dom";
import { PlusCircle, PenSquare, Tags, Award, ArrowRight } from "lucide-react";

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
    desc: "Найти существующую машину и изменить название, цвета, фото.",
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
];

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
            <ArrowRight
              size={16}
              className="text-mute group-hover:text-signal transition-colors shrink-0 mt-2"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
