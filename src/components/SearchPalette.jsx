import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useVehiclesContext } from "../context/VehiclesContext";
import { useTagsContext } from "../context/TagsContext";
import { getCategory } from "../data/categories";
import { norm, searchCatalog } from "../lib/search";

// Глобальный поиск (Ctrl/⌘+K): по названию, slug, тегу, названию цвета и hex.
// Прощает неверную раскладку, русские названия марок («бмв») и опечатки.
// Монтируется только когда открыт (см. Header), поэтому состояние сбрасывается само.
//
// Окно рисуется через портал в document.body. Header имеет backdrop-blur, а
// такой родитель становится «рамкой» для position: fixed — без портала
// затемнение растягивалось только на высоту шапки (тёмная полоска сверху).
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

  // страница под окном не прокручивается
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
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

  const found = useMemo(
    () => searchCatalog(vehicles, tags, query, { categoryName: (slug) => getCategory(slug)?.name || "" }),
    [query, vehicles, tags]
  );
  const results = found.results;

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

  const typed = norm(query).replace(/^#/, "");
  const note = found.fuzzy
    ? "Точных совпадений нет. Возможно, вы искали:"
    : results.length > 0 && found.used && found.used !== typed
    ? `Показано для «${found.used}»`
    : "";

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-[12vh] px-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Поиск"
        className="w-full max-w-xl rounded-lg border border-hair bg-panel shadow-lg overflow-hidden"
      >
        <div className="relative border-b border-hair">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-mute pointer-events-none" />
          <input
            ref={inputRef}
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
            <p className="font-body text-xs text-mute px-4 py-4">Начни вводить — например «bmw», «бмв», «чёрный» или «FF0000».</p>
          )}
          {query.trim() && results.length === 0 && (
            <p className="font-body text-xs text-mute px-4 py-4">Ничего не найдено.</p>
          )}
          {note && <p className="font-body text-[11px] text-mute px-4 pt-3 pb-1">{note}</p>}
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
    </div>,
    document.body
  );
}
