import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { fetchVehiclesFromSupabase } from "../data/vehicles";

const VehiclesContext = createContext(null);

// Оборачивает <App /> в main.jsx — запрос к Supabase уходит один раз при
// монтировании приложения, а не заново на каждой странице каталога.
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

  return (
    <VehiclesContext.Provider
      value={{
        vehicles: vehicles ?? [],
        loading: vehicles === null && !error,
        error,
        reload,
      }}
    >
      {children}
    </VehiclesContext.Provider>
  );
}

export function useVehiclesContext() {
  const ctx = useContext(VehiclesContext);
  if (!ctx) {
    throw new Error("useVehiclesContext должен вызываться внутри <VehiclesProvider>");
  }
  return ctx;
}
