import { Heart } from "lucide-react";
import { useFavorites } from "../context/FavoritesContext";

// size="sm" — маленькая кнопка-оверлей на карточке машины
// size="lg" — крупная кнопка на странице машины
export default function FavoriteButton({ slug, size = "sm", className = "" }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(slug);
  const iconSize = size === "lg" ? 18 : 15;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(slug);
      }}
      aria-pressed={active}
      aria-label={active ? "Убрать из избранного" : "Добавить в избранное"}
      title={active ? "Убрать из избранного" : "Добавить в избранное"}
      className={`flex items-center justify-center rounded-full border backdrop-blur-sm transition-all focus-visible:outline-2 focus-visible:outline-signal focus-visible:outline-offset-2 ${
        active
          ? "border-signal bg-signal/20 text-signal"
          : "border-hair/80 bg-base/60 text-mute hover:text-signal hover:border-signal/50"
      } ${size === "lg" ? "w-10 h-10" : "w-8 h-8"} ${className}`}
    >
      <Heart size={iconSize} strokeWidth={2} fill={active ? "currentColor" : "none"} />
    </button>
  );
}