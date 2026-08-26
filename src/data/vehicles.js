// Заменяет старый index.js. Реестр машин (src/data/vehicles/**/*.js)
// перенесён в Supabase (см. sql/vehicles-schema.sql +
// scripts/migrate-vehicles.mjs) — этот файл больше не импортирует
// отдельные .js-файлы машин, а читает их из таблицы vehicles.
//
// Категории и теги остаются статикой (их редко правят, смысла в
// Supabase для них нет) — реэкспортируются отсюда без изменений, чтобы
// компоненты вроде TagChip/VehicleCard не пришлось трогать.

import { supabaseRest } from "../lib/supabase";
import { categories, getCategory } from "./categories";
import { tags, tagGroups, getTag, getTagColor } from "./tags";

export { categories, getCategory };
export { tags, tagGroups, getTag, getTagColor };

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

// Простой модульный кэш — заполняется один раз VehiclesProvider'ом
// (см. src/context/VehiclesContext.jsx), но доступен и синхронно через
// getCachedVehicles() для мест, которым неудобно тянуть контекст
// (например src/data/credits.js — чистая функция без доступа к React).
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

// ВАЖНО: до первой успешной загрузки вернёт []. Компоненты, которым
// нужна гарантированная свежесть данных, должны использовать
// useVehiclesContext() вместо этой функции.
export function getCachedVehicles() {
  return _cache ?? [];
}

// --- чистые функции над уже загруженным списком машин --------------------
// (раньше читали замыканием общий массив `vehicles`, теперь массив —
// явный первый аргумент)

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

export function getUsedTagIds(list) {
  const set = new Set();
  list.forEach((v) => v.tags?.forEach((t) => set.add(t)));
  const order = new Map(tags.map((t, i) => [t.id, i]));
  return Array.from(set).sort((a, b) => (order.get(a) ?? 999) - (order.get(b) ?? 999));
}

// Цвет может быть одинарным (hex) или двухцветным (hexes: [a, b])
export function getColorHexes(color) {
  return color.hexes ?? [color.hex];
}

export function getColorAccentHex(color) {
  return color.accentHex ?? null;
}
