import { getColorHexes } from "../data/vehicles";

export default function ColorChip({ color, active, onClick }) {
  const hexes = getColorHexes(color);
  const background =
    hexes.length > 1
      ? `linear-gradient(135deg, ${hexes[0]} 50%, ${hexes[1]} 50%)`
      : hexes[0];

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-t-md rounded-b-sm border transition-all focus-visible:outline-2 focus-visible:outline-signal focus-visible:outline-offset-2 ${
        active
          ? "border-signal ring-2 ring-signal/50 -translate-y-1"
          : "border-hair hover:-translate-y-0.5 hover:border-mute"
      }`}
      aria-pressed={active}
      aria-label={`${color.name} ${hexes.join(", ")}`}
    >
      <span className="block h-14 rounded-t shadow-chip" style={{ background }} />
      <span className="block bg-raised2 rounded-b-sm px-1 py-1.5 text-center">
        <span className="block font-body text-[11px] text-ink leading-tight truncate">
          {color.name}
        </span>
        <span className="block font-mono text-[10px] text-mute leading-none mt-0.5 truncate">
          {hexes.map((h) => h.replace("#", "")).join(" / ")}
        </span>
      </span>
    </button>
  );
}