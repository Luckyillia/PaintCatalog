import { supabaseRest } from "../lib/supabase";
import { currentEditor } from "../lib/adminIdentity"; 

// Теги живут в Supabase (таблицы tag_groups и tags). Публичное чтение —
// с кэшем (fetchTagsFromSupabase, для TagsContext/сайта). Ниже — блок
// CRUD-функций для админки (src/pages/admin/TagsManager.jsx): они всегда
// идут в Supabase напрямую и после каждой правки сбрасывают кэш, чтобы
// сайт и форма машины подхватили изменения.

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

export function clearTagsCache() {
  _cache = null;
}

export function getTag(tags, id) {
  return tags.find((t) => t.id === id);
}

export function getTagColor(tags, id) {
  return getTag(tags, id)?.color ?? "#8b95a1";
}

// --- админка: сырые данные (без группировки) + CRUD ----------------------

export async function adminFetchTagGroups() {
  const rows = await supabaseRest("tag_groups?select=*&order=sort_order.asc");
  return rows.map((g) => ({
    id: g.id,
    label: g.label,
    sortOrder: g.sort_order ?? 0,
    editedBy: g.edited_by || "",
    editedAt: g.edited_at || "",
  }));
}

export async function adminFetchTags() {
  const rows = await supabaseRest("tags?select=*&order=sort_order.asc");
  return rows.map((t) => ({
    id: t.id,
    label: t.label,
    group: t.group_id,
    color: t.color,
    sortOrder: t.sort_order ?? 0,
    editedBy: t.edited_by || "",
    editedAt: t.edited_at || "",
  }));
}

export async function createTagGroup(group) {
  await supabaseRest("tag_groups", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify([
      { id: group.id, label: group.label, sort_order: group.sortOrder ?? 0, edited_by: currentEditor() },
    ]),
  });
  clearTagsCache();
}

export async function updateTagGroup(id, patch) {
  const body = { edited_by: currentEditor() };
  if (patch.label !== undefined) body.label = patch.label;
  if (patch.sortOrder !== undefined) body.sort_order = patch.sortOrder;
  await supabaseRest(`tag_groups?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(body),
  });
  clearTagsCache();
}

export async function deleteTagGroup(id) {
  await supabaseRest(`tag_groups?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
  clearTagsCache();
}

export async function createTag(tag) {
  await supabaseRest("tags", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify([
      {
        id: tag.id,
        label: tag.label,
        group_id: tag.group,
        color: tag.color,
        sort_order: tag.sortOrder ?? 0,
        edited_by: currentEditor(),
      },
    ]),
  });
  clearTagsCache();
}

export async function updateTag(id, patch) {
  const body = { edited_by: currentEditor() };
  if (patch.label !== undefined) body.label = patch.label;
  if (patch.group !== undefined) body.group_id = patch.group;
  if (patch.color !== undefined) body.color = patch.color;
  if (patch.sortOrder !== undefined) body.sort_order = patch.sortOrder;
  await supabaseRest(`tags?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(body),
  });
  clearTagsCache();
}

export async function deleteTag(id) {
  await supabaseRest(`tags?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
  clearTagsCache();
}
