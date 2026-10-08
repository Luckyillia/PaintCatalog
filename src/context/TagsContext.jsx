import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { fetchTagsFromSupabase, subscribeTagsInvalidation } from "../data/tags";

const TagsContext = createContext(null);

// Оборачивает <App /> в main.jsx — теги грузятся из Supabase один раз
// при монтировании приложения, а не заново на каждой странице.
// После правок в админке (clearTagsCache) провайдер перезагружает теги сам.
export function TagsProvider({ children }) {
  const [data, setData] = useState(null); // null = ещё не загружены
  const [error, setError] = useState("");

  const reload = useCallback(() => {
    setError("");
    fetchTagsFromSupabase()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => subscribeTagsInvalidation(reload), [reload]);

  return (
    <TagsContext.Provider
      value={{
        tags: data?.tags ?? [],
        tagGroups: data?.tagGroups ?? [],
        loading: data === null && !error,
        error,
        reload,
      }}
    >
      {children}
    </TagsContext.Provider>
  );
}

export function useTagsContext() {
  const ctx = useContext(TagsContext);
  if (!ctx) {
    throw new Error("useTagsContext должен вызываться внутри <TagsProvider>");
  }
  return ctx;
}
