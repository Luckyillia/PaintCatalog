import { getVehicle } from "./vehicles";
import { supabaseRest } from "../lib/supabase";

// Стена почёта теперь хранится в Supabase (таблицы credit_groups и
// credit_entries), а не в этом файле. Редактируется через
// /credits-constructor. Здесь остались только функции чтения/записи и
// чистая логика (getProviderNote и т.д.), которая раньше жила тут же.

// --- маппинг DB (snake_case) <-> приложение (camelCase) -----------------

function mapGroup(row) {
  return { id: row.id, title: row.title, sortOrder: row.sort_order ?? 0 };
}

function mapEntry(row) {
  return {
    id: row.id,
    groupId: row.group_id,
    name: row.name,
    role: row.role,
    note: row.note || "",
    avatar: row.avatar || "",
    link: row.link || "",
    providerId: row.provider_id || "",
    vehicleSlugs: row.vehicle_slugs || [],
    sortOrder: row.sort_order ?? 0,
  };
}

function entryToRow(entry) {
  return {
    group_id: entry.groupId,
    name: entry.name,
    role: entry.role,
    note: entry.note || null,
    avatar: entry.avatar || null,
    link: entry.link || null,
    provider_id: entry.providerId || null,
    vehicle_slugs: entry.vehicleSlugs?.length ? entry.vehicleSlugs : null,
    sort_order: entry.sortOrder ?? 0,
  };
}

// --- чтение (публичные страницы /credits и /provider/:id) ---------------

// Возвращает [{id, title, sortOrder, entries: [...]}], уже отсортированные
// по sortOrder — и группы, и записи внутри них.
export async function fetchCreditGroups() {
  const [groupRows, entryRows] = await Promise.all([
    supabaseRest("credit_groups?select=*&order=sort_order.asc"),
    supabaseRest("credit_entries?select=*&order=sort_order.asc"),
  ]);
  const groups = groupRows.map(mapGroup);
  const entries = entryRows.map(mapEntry);
  return groups.map((g) => ({
    ...g,
    entries: entries.filter((e) => e.groupId === g.id),
  }));
}

export async function fetchProviderById(id) {
  const rows = await supabaseRest(
    `credit_entries?provider_id=eq.${encodeURIComponent(id)}&select=*&limit=1`
  );
  return rows[0] ? mapEntry(rows[0]) : null;
}

// Берёт названия машин записи по vehicleSlugs (через реестр машин).
// Слаги, для которых машина не найдена, тихо пропускаются.
export function getProviderVehicleNames(entry) {
  return (entry?.vehicleSlugs ?? [])
    .map((slug) => getVehicle(slug)?.name)
    .filter(Boolean);
}

// Текст-подпись под именем: ручной note (если указан) — иначе
// автосписок названий машин по vehicleSlugs — иначе пусто.
export function getProviderNote(entry) {
  if (entry?.note) return entry.note;
  const names = getProviderVehicleNames(entry);
  return names.length > 0 ? names.join(", ") : "";
}

// --- запись (используется только в /credits-constructor) ----------------

export async function createGroup(group) {
  const rows = await supabaseRest("credit_groups", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify([
      { id: group.id, title: group.title, sort_order: group.sortOrder ?? 0 },
    ]),
  });
  return mapGroup(rows[0]);
}

export async function updateGroup(id, patch) {
  const body = {};
  if (patch.title !== undefined) body.title = patch.title;
  if (patch.sortOrder !== undefined) body.sort_order = patch.sortOrder;
  await supabaseRest(`credit_groups?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(body),
  });
}

export async function deleteGroup(id) {
  await supabaseRest(`credit_groups?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
}

export async function createEntry(entry) {
  const rows = await supabaseRest("credit_entries", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify([entryToRow(entry)]),
  });
  return mapEntry(rows[0]);
}

export async function updateEntry(id, entry) {
  await supabaseRest(`credit_entries?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(entryToRow(entry)),
  });
}

export async function deleteEntry(id) {
  await supabaseRest(`credit_entries?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
}