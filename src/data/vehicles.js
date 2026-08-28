// Реестр машин читается из Supabase (таблица vehicles). Категории
// остаются статикой. Теги — отдельно в src/data/tags.js / TagsContext.
//
// Помимо обычного публичного чтения (fetchVehiclesFromSupabase — с
// кэшем, для сайта), здесь есть блок функций для админки
// (adminFetchVehicles / adminSaveVehicle / adminDeleteVehicle) — они
// всегда идут в Supabase напрямую, без кэша, и используются в
// src/pages/admin/VehicleEditor.jsx и src/components/admin/VehicleForm.jsx.

import { supabaseRest } from "../lib/supabase";
import { categories, getCategory } from "./categories";
import { currentEditor } from "../lib/adminIdentity";

export { categories, getCategory };

function mapRow(row) {
  return {
    slug: row.slug,
    category: row.category,
    name: row.name,
    tags: row.tags || [],
    image: row.image || "",
    colors: row.colors || [],
    editedBy: row.edited_by || "",
    editedAt: row.edited_at || row.created_at || "",
  };
}

let _cache = null;
let _pending = null;

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

// Сбрасывает кэш публичного каталога — вызывается после любой правки в
// админке (создание/редактирование/удаление машины), чтобы сайт
// подхватил свежие данные при следующей загрузке VehiclesContext.
export function clearVehiclesCache() {
  _cache = null;
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

// --- админка: список (с тем же кэшем, что и публичный сайт — иначе
// список тормозит на каждое переключение вкладки в /admin, т.к.
// компонент вкладки размонтируется и монтируется заново) + запись/удаление

export async function adminFetchVehicles(forceRefresh = false) {
  return fetchVehiclesFromSupabase(forceRefresh);
}

// Upsert по slug — если машина с таким slug уже есть, запись полностью
// перезаписывается (тот же принцип, что был в старом конструкторе:
// повторная публикация того же slug = редактирование).
export async function adminSaveVehicle(vehicle) {
  await supabaseRest("vehicles?on_conflict=slug", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify([
      {
        slug: vehicle.slug,
        category: vehicle.category,
        name: vehicle.name,
        tags: vehicle.tags || [],
        image: vehicle.image || "",
        colors: vehicle.colors || [],
        edited_by: currentEditor(),
      },
    ]),
  });
}


export async function adminDeleteVehicle(slug) {
  await supabaseRest(`vehicles?slug=eq.${encodeURIComponent(slug)}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
}
