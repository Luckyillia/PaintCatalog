import { useEffect, useState, useCallback } from "react";
import { fetchVehiclesFromSupabase, subscribeVehiclesInvalidation } from "../data/vehicles";
import { VehiclesContext } from "./VehiclesContext";

// Запрос к Supabase уходит один раз при монтировании; после правок в
// админке (clearVehiclesCache) провайдер сам перезагружает список.
export function VehiclesProvider({ children }) {
  const [vehicles, setVehicles] = useState(null); // null = ещё не загружены
  const [error, setError] = useState("");

  const reload = useCallback(() => {
    setError("");
    fetchVehiclesFromSupabase()
      .then(setVehicles)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => subscribeVehiclesInvalidation(reload), [reload]);

  return (
    <VehiclesContext.Provider
      value={{ vehicles: vehicles ?? [], loading: vehicles === null && !error, error, reload }}
    >
      {children}
    </VehiclesContext.Provider>
  );
}
