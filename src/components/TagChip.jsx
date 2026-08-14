import { getTag, getTagColor } from "../data/vehicles";

export default function TagChip({ tagId, active, onClick }) {
  const tag = getTag(tagId);
  if (!tag) return null;
  const color = getTagColor(tagId);

  return (
    <button
      onClick={onClick}
      className="shrink-0 font-mono text-[11px] uppercase tracking-wide px-3 py-1.5 rounded-full border transition-all duration-150 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-signal focus-visible:outline-offset-2"
      style={{
        borderColor: color,
        background: active ? color : "transparent",
        color: active ? "#0a0c0f" : color,
        boxShadow: active
          ? `0 0 0 1px ${color}, 0 0 10px 0 ${color}66`
          : `0 0 6px 0 ${color}4d`,
      }}
      aria-pressed={active}
    >
      {tag.label}
    </button>
  );
}