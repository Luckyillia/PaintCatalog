import { Link } from "react-router-dom";
import PhotoSlot from "./PhotoSlot";
import { useTagsContext } from "../context/TagsContext";
import { getTag, getTagColor } from "../data/tags";

export default function VehicleCard({ vehicle }) {
  const { tags } = useTagsContext();
  const tagList = (vehicle.tags ?? [])
    .map((id) => getTag(tags, id))
    .filter(Boolean);

  return (
    <Link
      to={`/vehicle/${vehicle.slug}`}
      className="group rounded-lg border border-hair bg-panel overflow-hidden hover:border-signal/50 transition-colors flex flex-col"
    >
      <PhotoSlot
        src={vehicle.image}
        alt={vehicle.name}
        className="h-36"
        label="Фото пока не загружено"
      />
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-lg tracking-wide text-ink group-hover:text-signal transition-colors">
            {vehicle.name}
          </h3>
          <span className="font-mono text-xs text-mute whitespace-nowrap">
            {vehicle.colors.length} цветов
          </span>
        </div>

        {tagList.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {tagList.map((tag) => (
              <span
                key={tag.id}
                title={tag.label}
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: getTagColor(tags, tag.id) }}
              />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}