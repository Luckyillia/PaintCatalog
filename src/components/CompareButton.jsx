import { ArrowLeftRight } from "lucide-react";
import { useCompare } from "../context/CompareContext";
import { COMPARE_LIMIT } from "../lib/compare";

// withLabel — крупная кнопка с подписью (страница машины);
// без неё — маленькая круглая иконка-оверлей на карточке (как FavoriteButton).
export default function CompareButton({ slug, colorId, withLabel = false, className = "" }) {
  const { has, toggle, isFull } = useCompare();
  const active = has(slug, colorId);
  const blocked = !active && isFull;
  const title = active
    ? "Убрать из сравнения"
    : blocked
    ? `В сравнении может быть максимум ${COMPARE_LIMIT} цвета`
    : "Добавить в сравнение";

  const state = active
    ? "border-signal bg-signal/20 text-signal"
    : blocked
    ? "border-hair bg-base/60 text-mute opacity-40 cursor-not-allowed"
    : "border-hair/80 bg-base/60 text-mute hover:text-signal hover:border-signal/50";
  const shape = withLabel
    ? "gap-1.5 rounded-md px-3 py-2 font-body text-xs"
    : "w-8 h-8 rounded-full backdrop-blur-sm";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!blocked) toggle(slug, colorId);
      }}
      aria-pressed={active}
      aria-disabled={blocked}
      aria-label={title}
      title={title}
      className={`flex items-center justify-center border transition-all focus-visible:outline-2 focus-visible:outline-signal focus-visible:outline-offset-2 ${shape} ${state} ${className}`}
    >
      <ArrowLeftRight size={withLabel ? 14 : 15} strokeWidth={2} />
      {withLabel && (active ? "В сравнении" : "В сравнение")}
    </button>
  );
}
