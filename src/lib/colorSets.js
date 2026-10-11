import { decodeCompare, encodeCompare } from "./compare.js";

// Именованные наборы цветов («цвета для моей фракции»): надстройка над
// сравнением, хранится в localStorage. Каждый набор — до COMPARE_LIMIT окрасок
// в том же формате, что и ссылка /compare?c=…

export const SETS_KEY = "osnova:color-sets";
export const MAX_SETS = 20;
export const MAX_NAME = 40;

function cleanName(v) {
  return typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, MAX_NAME) : "";
}

function cleanItems(items) {
  const ok = (Array.isArray(items) ? items : []).filter(
    (i) => i && typeof i.slug === "string" && typeof i.colorId === "string"
  );
  return decodeCompare(encodeCompare(ok));
}

export function normalizeSets(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const s of raw) {
    if (!s || typeof s !== "object") continue;
    const name = cleanName(s.name);
    const items = cleanItems(s.items);
    if (!name || items.length === 0) continue;
    out.push({ id: String(s.id || ""), name, items, createdAt: Number(s.createdAt) || 0 });
    if (out.length >= MAX_SETS) break;
  }
  return out;
}

// Возвращает { sets } или { error }. Набор с таким же именем заменяется.
export function addSet(sets, name, items, { now = Date.now(), id } = {}) {
  const clean = cleanName(name);
  if (!clean) return { error: "Дай набору название." };
  const list = cleanItems(items);
  if (list.length === 0) return { error: "В наборе нет ни одного цвета." };
  const rest = sets.filter((s) => s.name.toLowerCase() !== clean.toLowerCase());
  const entry = {
    id: id || `s${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name: clean,
    items: list,
    createdAt: now,
  };
  return { sets: [entry, ...rest].slice(0, MAX_SETS) };
}

export function removeSet(sets, id) {
  return sets.filter((s) => s.id !== id);
}

export function readSets() {
  try {
    return normalizeSets(JSON.parse(localStorage.getItem(SETS_KEY) || "[]"));
  } catch {
    return [];
  }
}

export function writeSets(sets) {
  try {
    localStorage.setItem(SETS_KEY, JSON.stringify(sets));
  } catch {
    // localStorage недоступен — набор не сохранится
  }
}
