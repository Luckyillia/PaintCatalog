import { useEffect, useRef, useState, useCallback } from "react";
import { fetchVehiclesFromSupabase, readStoredVehicles, subscribeVehiclesInvalidation } from "../data/vehicles";
import { VehiclesContext } from "./VehiclesContext";

// Запрос к Supabase уходит один раз при монтировании; после правок в
// админке (clearVehiclesCache) провайдер сам перезагружает список.
// Стартовое значение берётся из localStorage (если есть) — сайт открывается
// мгновенно, а свежие данные заменяют его, как только придут.
export function VehiclesProvider({ children }) {
  const [vehicles, setVehicles] = useState(readStoredVehicles); // null = ничего нет
  const [error, setError] = useState("");
  const hasData = useRef(vehicles !== null);

  const reload = useCallback(() => {
    setError("");
    fetchVehiclesFromSupabase()
      .then((rows) => {
        hasData.current = true;
        setVehicles(rows);
      })
      .catch((err) => {
        // если уже показываем сохранённый каталог, сетевой сбой не должен его прятать
        if (!hasData.current) setError(err.message);
      });
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
