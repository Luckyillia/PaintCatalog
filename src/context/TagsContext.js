import { createContext, useContext } from "react";

export const TagsContext = createContext(null);

export function useTagsContext() {
  const ctx = useContext(TagsContext);
  if (!ctx) {
    throw new Error("useTagsContext должен вызываться внутри <TagsProvider>");
  }
  return ctx;
}
