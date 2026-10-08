import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useVehiclesContext } from "../context/VehiclesContext";
import { useTagsContext } from "../context/TagsContext";
import { getCategory } from "../data/categories";

// Глобальный поиск (Ctrl/⌘+K): по названию, slug, тегу, названию цвета и hex.
// Монтируется только когда открыт (см. Header), поэтому состояние сбрасывается само.
export default function SearchPalette({ onClose }) {
  const navigate = useNavigate();
  const { vehicles } = useVehiclesContext();
  const { tags } = useTagsContext();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);

  // фокус в поле при открытии
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Esc работает всегда, независимо от того, где сейчас фокус
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^#/, "");
    if (!q) return [];
    const tagLabel = new Map(tags.map((t) => [t.id, t.label.toLowerCase()]));
    const out = [];
    for (const v of vehicles) {
      const cat = getCategory(v.category)?.name || "";
      if (v.name.toLowerCase().includes(q) || v.slug.includes(q)) {
        out.push({ v, score: 0, hint: cat });
        continue;
      }
      const tag = (v.tags || []).find((id) => tagLabel.get(id)?.includes(q));
      if (tag) {
        out.push({ v, score: 1, hint: `тег: ${tagLabel.get(tag)}` });
        continue;
      }
      const color = (v.colors || []).find(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.hexes ?? [c.hex]).some((h) => h?.toLowerCase().replace("#", "").includes(q))
      );
      if (color) out.push({ v, score: 2, hint: `цвет: ${color.name}`, colorId: color.id });
    }
    return out.sort((a, b) => a.score - b.score).slice(0, 8);
  }, [query, vehicles, tags]);

  function go(item) {
    if (!item) return;
    const suffix = item.colorId ? `?color=${encodeURIComponent(item.colorId)}` : "";
    navigate(`/vehicle/${item.v.slug}${suffix}`);
    onClose();
  }

  function handleKeyDown(e) {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") go(results[active]);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center pt-24 px-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-xl rounded-lg border border-hair bg-panel shadow-lg overflow-hidden">
        <div className="relative border-b border-hair">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-mute pointer-events-none" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Машина, тег, название цвета или hex..."
            className="w-full bg-transparent pl-11 pr-4 py-4 font-body text-sm text-ink placeholder:text-mute focus:outline-none"
          />
        </div>
        <div className="max-h-80 overflow-y-auto chip-scroll">
          {!query.trim() && (
            <p className="font-body text-xs text-mute px-4 py-4">Начни вводить — например «bmw», «чёрный» или «FF0000».</p>
          )}
          {query.trim() && results.length === 0 && (
            <p className="font-body text-xs text-mute px-4 py-4">Ничего не найдено.</p>
          )}
          {results.map((item, i) => (
            <button
              key={item.v.slug}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(item)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                i === active ? "bg-raised2" : ""
              }`}
            >
              <span className="font-display text-base tracking-wide text-ink truncate">{item.v.name}</span>
              <span className="font-mono text-[11px] text-mute shrink-0">{item.hint}</span>
            </button>
          ))}
        </div>
        <div className="border-t border-hair px-4 py-2 font-mono text-[10px] text-mute flex gap-4">
          <span>↑↓ выбор</span>
          <span>Enter открыть</span>
          <span>Esc закрыть</span>
        </div>
      </div>
    </div>
  );
}
