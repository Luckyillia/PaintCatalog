import { useMemo } from "react";
import { X } from "lucide-react";
import FilterDropdown from "./FilterDropdown";
import TagChip from "./TagChip";
import { tagGroups, tags as allTags } from "../data/vehicles";

export default function TagFilterBar({ availableTagIds, selected, onToggle, onClear }) {
  const groups = useMemo(() => {
    if (!availableTagIds || availableTagIds.length === 0) return [];
    const availableSet = new Set(availableTagIds);
    return tagGroups
      .map((g) => ({
        ...g,
        tagIds: allTags
          .filter((t) => t.group === g.id && availableSet.has(t.id))
          .map((t) => t.id),
      }))
      .filter((g) => g.tagIds.length > 0);
  }, [availableTagIds]);

  if (groups.length === 0) return null;

  function toggleOne(id) {
    onToggle(
      selected.includes(id) ? selected.filter((t) => t !== id) : [...selected, id]
    );
  }

  return (
    <div className="mb-6 flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        {groups.map((g) => (
          <FilterDropdown
            key={g.id}
            label={g.label}
            tagIds={g.tagIds}
            selected={selected}
            onToggle={toggleOne}
          />
        ))}
      </div>

      {selected.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap chip-scroll overflow-x-auto pb-1">
          {selected.map((id) => (
            <TagChip key={id} tagId={id} active removable onClick={() => toggleOne(id)} />
          ))}
          <button
            onClick={onClear}
            className="shrink-0 flex items-center gap-1 font-body text-[11px] text-mute hover:text-signal transition-colors ml-1"
          >
            <X size={12} />
            Сбросить всё
          </button>
        </div>
      )}
    </div>
  );
}
