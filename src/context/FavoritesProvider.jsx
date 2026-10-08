import { useEffect, useState, useCallback } from "react";
import { FavoritesContext } from "./FavoritesContext";

const FAVORITES_KEY = "osnova:favorites";
const RECENT_KEY = "osnova:recently-viewed";
const RECENT_LIMIT = 12;

function readList(key) {
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeList(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // localStorage недоступен (приватный режим и т.п.) — молча игнорируем
  }
}

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(() => readList(FAVORITES_KEY));
  const [recent, setRecent] = useState(() => readList(RECENT_KEY));

  // запись в localStorage — отдельным эффектом, а не внутри setState
  useEffect(() => writeList(FAVORITES_KEY, favorites), [favorites]);
  useEffect(() => writeList(RECENT_KEY, recent), [recent]);

  // синхронизация между вкладками
  useEffect(() => {
    function handleStorage(e) {
      if (e.key === FAVORITES_KEY) setFavorites(readList(FAVORITES_KEY));
      if (e.key === RECENT_KEY) setRecent(readList(RECENT_KEY));
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const toggleFavorite = useCallback((slug) => {
    setFavorites((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [slug, ...prev]));
  }, []);

  const isFavorite = useCallback((slug) => favorites.includes(slug), [favorites]);
  const clearFavorites = useCallback(() => setFavorites([]), []);

  const addRecentlyViewed = useCallback((slug) => {
    setRecent((prev) => {
      if (prev[0] === slug) return prev;
      return [slug, ...prev.filter((s) => s !== slug)].slice(0, RECENT_LIMIT);
    });
  }, []);
  const clearRecent = useCallback(() => setRecent([]), []);

  return (
    <FavoritesContext.Provider
      value={{ favorites, recent, toggleFavorite, isFavorite, clearFavorites, addRecentlyViewed, clearRecent }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}
