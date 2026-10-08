import { useEffect, useState, useCallback } from "react";
import { fetchTagsFromSupabase, subscribeTagsInvalidation } from "../data/tags";
import { TagsContext } from "./TagsContext";

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
