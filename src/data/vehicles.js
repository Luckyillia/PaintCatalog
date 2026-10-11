// Реестр машин читается из Supabase (таблица vehicles). Категории
// остаются статикой. Теги — отдельно в src/data/tags.js / TagsContext.
//
// Кэш каталога: последний удачный ответ хранится в localStorage, и при
// следующем заходе сайт сразу показывает его, а свежие данные подтягивает
// в фоне (stale-while-revalidate). Админские правки сбрасывают кэш через
// clearVehiclesCache(), так что устаревшее видно максимум до конца запроса.

import { supabaseRest } from "../lib/supabase";
import { categories, getCategory } from "./categories";
import { adminDb } from "../lib/adminApi";

export { categories, getCategory };

function mapRow(row) {
  return {
    slug: row.slug,
    category: row.category,
    name: row.name,
    tags: row.tags || [],
    image: row.image || "",
    colors: row.colors || [],
    createdAt: row.created_at || "",
    editedBy: row.edited_by || "",
    editedAt: row.edited_at || row.created_at || "",
  };
}

const STORE_KEY = "osnova:vehicles:v1";
const STORE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// Возвращает ранее сохранённый каталог или null (нет, устарел, битый).
export function readStoredVehicles() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const { savedAt, rows } = JSON.parse(raw);
    if (!Array.isArray(rows) || !(Date.now() - savedAt < STORE_MAX_AGE_MS)) return null;
    return rows;
  } catch {
    return null;
  }
}

function storeVehicles(rows) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ savedAt: Date.now(), rows }));
  } catch {
    // нет места или localStorage недоступен — кэш просто не сохранится
  }
}

let _cache = null; // свежие данные этой сессии
let _stale; // данные из localStorage (читаются лениво, один раз)
let _pending = null;

const _listeners = new Set();

export function subscribeVehiclesInvalidation(fn) {
  _listeners.add(fn);
  return () => {
    _listeners.delete(fn);
  };
}

export async function fetchVehiclesFromSupabase(forceRefresh = false) {
  if (forceRefresh) _cache = null;
  if (_cache) return _cache;
  if (!_pending) {
    _pending = supabaseRest("vehicles?select=*&order=name.asc")
      .then((rows) => {
        _cache = rows.map(mapRow);
        storeVehicles(_cache);
        return _cache;
      })
      .finally(() => {
        _pending = null;
      });
  }
  return _pending;
}

export function getCachedVehicles() {
  if (_cache) return _cache;
  if (_stale === undefined) _stale = readStoredVehicles();
  return _stale ?? [];
}

export function clearVehiclesCache() {
  _cache = null;
  _listeners.forEach((fn) => fn());
}

export function getVehicle(vehicles, slug) {
  return vehicles.find((v) => v.slug === slug);
}

export function getVehiclesByCategory(vehicles, slug) {
  return vehicles.filter((v) => v.category === slug);
}

export function getVehiclesByTags(list, tagIds) {
  if (!tagIds || tagIds.length === 0) return list;
  return list.filter((v) => v.tags?.some((t) => tagIds.includes(t)));
}

export function getUsedTagIds(list, tags) {
  const set = new Set();
  list.forEach((v) => v.tags?.forEach((t) => set.add(t)));
  const order = new Map(tags.map((t, i) => [t.id, i]));
  return Array.from(set).sort((a, b) => (order.get(a) ?? 999) - (order.get(b) ?? 999));
}

export function getColorHexes(color) {
  return color.hexes ?? [color.hex];
}

export function getColorAccentHex(color) {
  return color.accentHex ?? null;
}

// --- админка ---------------------------------------------------------

export async function adminFetchVehicles(forceRefresh = false) {
  return fetchVehiclesFromSupabase(forceRefresh);
}

export async function adminSaveVehicle(vehicle) {
  await adminDb("vehicles", "upsert", {
    rows: [
      {
        slug: vehicle.slug,
        category: vehicle.category,
        name: vehicle.name,
        tags: vehicle.tags || [],
        image: vehicle.image || "",
        colors: vehicle.colors || [],
      },
    ],
  });
}

export async function adminDeleteVehicle(slug) {
  await adminDb("vehicles", "delete", { keyValue: slug });
}
