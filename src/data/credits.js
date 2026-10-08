import { getVehicle, getCachedVehicles } from "./vehicles";
import { supabaseRest } from "../lib/supabase";
import { adminDb } from "../lib/adminApi";

// Стена почёта хранится в Supabase (таблицы credit_groups и
// credit_entries). Редактируется через /admin/credits. Здесь
// остались только функции чтения/записи и чистая логика (getProviderNote
// и т.д.).
//
// getProviderVehicleNames использует getCachedVehicles() (см.
// src/data/vehicles.js) вместо контекста, потому что это чистая функция
// без доступа к React-дереву (вызывается из CreditCard.jsx и
// ProviderDetail.jsx). VehiclesProvider наполняет этот кэш при старте
// приложения — на практике к моменту первого рендера стены почёта он уже
// готов, но в первые миллисекунды загрузки заметка под именем может быть
// пустой, пока кэш не прогрелся.

// --- маппинг DB (snake_case) <-> приложение (camelCase) -----------------

function mapGroup(row) {
  return {
    id: row.id,
    title: row.title,
    sortOrder: row.sort_order ?? 0,
    editedBy: row.edited_by || "",
    editedAt: row.edited_at || "",
  };
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
    editedBy: row.edited_by || "",
    editedAt: row.edited_at || "",
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

// Берёт названия машин записи по vehicleSlugs (через кэш реестра машин).
// Слаги, для которых машина не найдена, тихо пропускаются.
export function getProviderVehicleNames(entry) {
  const vehicles = getCachedVehicles();
  return (entry?.vehicleSlugs ?? [])
    .map((slug) => getVehicle(vehicles, slug)?.name)
    .filter(Boolean);
}

// Текст-подпись под именем: ручной note (если указан) — иначе
// автосписок названий машин по vehicleSlugs — иначе пусто.
export function getProviderNote(entry) {
  if (entry?.note) return entry.note;
  const names = getProviderVehicleNames(entry);
  return names.length > 0 ? names.join(", ") : "";
}

// --- запись (используется только в /admin/credits) ----------------------
// Идёт через сервер (api/admin-db.js): токен админа, service_role,
// edited_by ставится на сервере.

export async function createGroup(group) {
  const rows = await adminDb("credit_groups", "insert", {
    rows: [{ id: group.id, title: group.title, sort_order: group.sortOrder ?? 0 }],
  });
  return mapGroup(rows[0]);
}

export async function updateGroup(id, patch) {
  const body = {};
  if (patch.title !== undefined) body.title = patch.title;
  if (patch.sortOrder !== undefined) body.sort_order = patch.sortOrder;
  await adminDb("credit_groups", "update", { keyValue: id, patch: body });
}

export async function deleteGroup(id) {
  await adminDb("credit_groups", "delete", { keyValue: id });
}

export async function createEntry(entry) {
  const rows = await adminDb("credit_entries", "insert", { rows: [entryToRow(entry)] });
  return mapEntry(rows[0]);
}

export async function updateEntry(id, entry) {
  await adminDb("credit_entries", "update", { keyValue: id, patch: entryToRow(entry) });
}

export async function deleteEntry(id) {
  await adminDb("credit_entries", "delete", { keyValue: id });
}
