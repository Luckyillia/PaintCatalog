// Реестр машин читается из Supabase (таблица vehicles). Категории
// остаются статикой. Теги — отдельно в src/data/tags.js / TagsContext.

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

let _cache = null;
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
        return _cache;
      })
      .finally(() => {
        _pending = null;
      });
  }
  return _pending;
}

export function getCachedVehicles() {
  return _cache ?? [];
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
