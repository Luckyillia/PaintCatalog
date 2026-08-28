import { createContext, useContext, useEffect, useState, useCallback } from "react";

const FAVORITES_KEY = "osnova:favorites";
const RECENT_KEY = "osnova:recently-viewed";
const RECENT_LIMIT = 12;

const FavoritesContext = createContext(null);

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

// Оборачивает <App /> в main.jsx. Всё хранится в localStorage —
// избранное и история просмотров переживают перезагрузку страницы,
// но живут только в этом браузере (никакого бэкенда).
export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(() => readList(FAVORITES_KEY));
  const [recent, setRecent] = useState(() => readList(RECENT_KEY));

  // синхронизация между вкладками одного браузера
  useEffect(() => {
    function handleStorage(e) {
      if (e.key === FAVORITES_KEY) setFavorites(readList(FAVORITES_KEY));
      if (e.key === RECENT_KEY) setRecent(readList(RECENT_KEY));
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const toggleFavorite = useCallback((slug) => {
    setFavorites((prev) => {
      const next = prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [slug, ...prev];
      writeList(FAVORITES_KEY, next);
      return next;
    });
  }, []);

  const isFavorite = useCallback((slug) => favorites.includes(slug), [favorites]);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
    writeList(FAVORITES_KEY, []);
  }, []);

  const addRecentlyViewed = useCallback((slug) => {
    setRecent((prev) => {
      const next = [slug, ...prev.filter((s) => s !== slug)].slice(0, RECENT_LIMIT);
      writeList(RECENT_KEY, next);
      return next;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecent([]);
    writeList(RECENT_KEY, []);
  }, []);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        recent,
        toggleFavorite,
        isFavorite,
        clearFavorites,
        addRecentlyViewed,
        clearRecent,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites должен вызываться внутри <FavoritesProvider>");
  }
  return ctx;
}