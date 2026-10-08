import { createContext, useContext } from "react";

export const VehiclesContext = createContext(null);

export function useVehiclesContext() {
  const ctx = useContext(VehiclesContext);
  if (!ctx) {
    throw new Error("useVehiclesContext должен вызываться внутри <VehiclesProvider>");
  }
  return ctx;
}
