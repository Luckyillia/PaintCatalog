import { getSession } from "./adminApi";

// Счётчики популярности: открытия машин и копирования цветов. Не чаще одного
// раза за сессию на каждую машину/цвет; админов не считаем.

const SEEN_KEY = "osnova:tracked";
const EMPTY = { vehicles: [], colors: [] };

export function trackHit(payload) {
  if (getSession()) return;
  try {
    const id = JSON.stringify(payload);
    const seen = JSON.parse(sessionStorage.getItem(SEEN_KEY) || "[]");
    if (seen.includes(id)) return;
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seen.slice(-200), id]));
  } catch {
    // без sessionStorage просто отправим как есть
  }
  try {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // аналитика не критична
  }
}

let _popular = null;

export function fetchPopular() {
  if (!_popular) {
    _popular = fetch("/api/popular")
      .then((r) => (r.ok ? r.json() : EMPTY))
      .then((d) => ({
        vehicles: Array.isArray(d?.vehicles) ? d.vehicles : [],
        colors: Array.isArray(d?.colors) ? d.colors : [],
      }))
      .catch(() => EMPTY);
  }
  return _popular;
}
