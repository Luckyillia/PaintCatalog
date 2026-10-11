import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useTagsContext } from "../context/TagsContext";
import { getTag, getTagColor } from "../data/tags";

const EDGE = 12; // минимальный отступ меню от края экрана, px

export default function FilterDropdown({ label, tagIds, selected, onToggle }) {
  const { tags } = useTagsContext();
  const [open, setOpen] = useState(false);
  const [shift, setShift] = useState(0);
  const ref = useRef(null);
  const menuRef = useRef(null);
  const activeCount = tagIds.filter((id) => selected.includes(id)).length;

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function handleEscape(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Если меню при открытии выходит за правый край экрана — сдвигаем его влево.
  useLayoutEffect(() => {
    if (!open || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const naturalRight = rect.right - shift;
    const overflow = naturalRight - (window.innerWidth - EDGE);
    setShift(overflow > 0 ? -overflow : 0);
    // shift намеренно не в зависимостях: считаем от «естественного» положения
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!tagIds || tagIds.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-md border px-3 py-2.5 sm:py-2 font-body text-sm transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-signal focus-visible:outline-offset-2 ${
          activeCount > 0
            ? "border-signal/50 bg-signal/10 text-signal"
            : "border-hair bg-raised text-ink hover:border-mute"
        }`}
        aria-expanded={open}
      >
        {label}
        {activeCount > 0 && (
          <span className="font-mono text-[10px] leading-none bg-signal text-[#0a0c0f] rounded-full w-4 h-4 flex items-center justify-center">
            {activeCount}
          </span>
        )}
        <ChevronDown
          size={14}
          className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          ref={menuRef}
          style={{ left: shift }}
          className="absolute top-full mt-2 w-64 max-w-[calc(100vw-1.5rem)] max-h-72 overflow-y-auto rounded-md border border-hair bg-raised shadow-lg z-30 p-1.5 chip-scroll"
        >
          {tagIds.map((id) => {
            const tag = getTag(tags, id);
            if (!tag) return null;
            const color = getTagColor(tags, id);
            const active = selected.includes(id);
            return (
              <button
                key={id}
                onClick={() => onToggle(id)}
                className="w-full flex items-center gap-2 rounded px-2 py-2.5 sm:py-1.5 hover:bg-raised2 transition-colors text-left"
              >
                <span
                  className="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors"
                  style={{
                    borderColor: color,
                    background: active ? color : "transparent",
                  }}
                >
                  {active && (
                    <Check size={11} strokeWidth={3} className="text-[#0a0c0f]" />
                  )}
                </span>
                <span className="font-body text-sm text-ink truncate">
                  {tag.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
