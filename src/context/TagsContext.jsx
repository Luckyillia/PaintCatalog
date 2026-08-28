import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { fetchTagsFromSupabase } from "../data/tags";

const TagsContext = createContext(null);

// Оборачивает <App /> в main.jsx — теги грузятся из Supabase один раз
// при монтировании приложения, а не заново на каждой странице.
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