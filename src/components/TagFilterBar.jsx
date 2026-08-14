import TagChip from "./TagChip";

export default function TagFilterBar({ availableTagIds, selected, onToggle, onClear }) {
  if (!availableTagIds || availableTagIds.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 flex-wrap chip-scroll overflow-x-auto pb-1">
        {availableTagIds.map((id) => (
          <TagChip
            key={id}
            tagId={id}
            active={selected.includes(id)}
            onClick={() =>
              onToggle(selected.includes(id) ? selected.filter((t) => t !== id) : [...selected, id])
            }
          />
        ))}
        {selected.length > 0 && (
          <button
            onClick={onClear}
            className="shrink-0 font-body text-[11px] text-mute hover:text-signal underline underline-offset-2 ml-1"
          >
            Сбросить фильтр
          </button>
        )}
      </div>
    </div>
  );
}