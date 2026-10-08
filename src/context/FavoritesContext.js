import { createContext, useContext } from "react";

export const FavoritesContext = createContext(null);

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites должен вызываться внутри <FavoritesProvider>");
  }
  return ctx;
}
