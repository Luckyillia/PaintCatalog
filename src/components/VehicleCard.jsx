import { Link } from "react-router-dom";
import PhotoSlot from "./PhotoSlot";
import FavoriteButton from "./FavoriteButton";
import { useTagsContext } from "../context/TagsContext";
import { getTag, getTagColor } from "../data/tags";

const NEW_DAYS = 14;

export default function VehicleCard({ vehicle }) {
  const { tags } = useTagsContext();
  const tagList = (vehicle.tags ?? []).map((id) => getTag(tags, id)).filter(Boolean);
  const isNew =
    vehicle.createdAt && Date.now() - new Date(vehicle.createdAt).getTime() < NEW_DAYS * 86400000;

  return (
    <Link
      to={`/vehicle/${vehicle.slug}`}
      className="group rounded-lg border border-hair bg-panel overflow-hidden hover:border-signal/50 transition-colors flex flex-col"
    >
      <div className="relative">
        <PhotoSlot src={vehicle.image} alt={vehicle.name} className="h-36" label="Фото пока не загружено" width={480} />
        {isNew && (
          <span className="absolute top-2 left-2 z-10 font-mono text-[10px] uppercase tracking-wide bg-signal text-[#0a0c0f] rounded px-1.5 py-0.5">
            Новое
          </span>
        )}
        <FavoriteButton slug={vehicle.slug} className="absolute top-2 right-2 z-10" />
      </div>
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-lg tracking-wide text-ink group-hover:text-signal transition-colors">
            {vehicle.name}
          </h3>
          <span className="font-mono text-xs text-mute whitespace-nowrap">{vehicle.colors.length} цветов</span>
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
