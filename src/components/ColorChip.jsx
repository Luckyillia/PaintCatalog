export default function ColorChip({ color, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 w-16 rounded-t-md rounded-b-sm border transition-all focus-visible:outline-2 focus-visible:outline-signal focus-visible:outline-offset-2 ${
        active
          ? "border-signal ring-2 ring-signal/50 -translate-y-1"
          : "border-hair hover:-translate-y-0.5 hover:border-mute"
      }`}
      aria-pressed={active}
      aria-label={`${color.name} ${color.hex}`}
    >
      <span
        className="block h-14 rounded-t shadow-chip"
        style={{ background: color.hex }}
      />
      <span className="block bg-raised2 rounded-b-sm px-1 py-1 text-center">
        <span className="block font-mono text-[10px] text-mute leading-none">
          {color.hex.replace("#", "")}
        </span>
      </span>
    </button>
  );
}
