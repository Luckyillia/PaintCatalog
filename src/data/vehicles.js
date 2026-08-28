// Реестр машин читается из Supabase (таблица vehicles). Категории
// остаются статикой. Теги теперь отдельно в src/data/tags.js /
// TagsContext — этот файл их больше не хранит и не реэкспортирует.

import { supabaseRest } from "../lib/supabase";
import { categories, getCategory } from "./categories";

export { categories, getCategory };

function mapRow(row) {
  return {
    slug: row.slug,
    category: row.category,
    name: row.name,
    tags: row.tags || [],
    image: row.image || "",
    colors: row.colors || [],
  };
}

let _cache = null;
let _pending = null;

export async function fetchVehiclesFromSupabase() {
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

// Теперь принимает список тегов явным аргументом (берётся из
// useTagsContext на странице), чтобы порядок сортировки шёл из базы,
// а не из статического файла.
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