import { createContext, useContext } from "react";

export const CompareContext = createContext(null);

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) {
    throw new Error("useCompare должен вызываться внутри <CompareProvider>");
  }
  return ctx;
}
