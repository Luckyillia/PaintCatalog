import { supabaseRest } from "../lib/supabase";

// Теги теперь живут в Supabase (таблицы tag_groups и tags), а не в
// статическом массиве. Этот модуль — тонкая обёртка над fetch + кэш,
// по тому же паттерну, что src/data/vehicles.js.

let _cache = null;
let _pending = null;

export async function fetchTagsFromSupabase() {
  if (_cache) return _cache;
  if (!_pending) {
    _pending = Promise.all([
      supabaseRest("tag_groups?select=*&order=sort_order.asc"),
      supabaseRest("tags?select=*&order=sort_order.asc"),
    ])
      .then(([groupRows, tagRows]) => {
        _cache = {
          tagGroups: groupRows.map((g) => ({ id: g.id, label: g.label })),
          tags: tagRows.map((t) => ({
            id: t.id,
            label: t.label,
            group: t.group_id,
            color: t.color,
          })),
        };
        return _cache;
      })
      .finally(() => {
        _pending = null;
      });
  }
  return _pending;
}

export function getCachedTags() {
  return _cache ?? { tagGroups: [], tags: [] };
}

export function getTag(tags, id) {
  return tags.find((t) => t.id === id);
}

export function getTagColor(tags, id) {
  return getTag(tags, id)?.color ?? "#8b95a1";
}