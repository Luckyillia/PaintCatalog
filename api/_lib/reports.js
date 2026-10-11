import crypto from "node:crypto";

// Логика публичной формы репортов (api/report.js) — вынесена отдельно,
// чтобы её можно было проверять тестами без сети и Supabase.

export const REPORT_KINDS = ["color_error", "new_vehicle"];

export const LIMIT_PER_HOUR = 5; // с одного IP
export const LIMIT_PER_DAY = 15; // с одного IP
export const GLOBAL_PER_HOUR = 200; // со всех вместе — защита от потока с разных IP
export const MIN_FILL_MS = 1500; // быстрее человек форму не заполнит

const PART = /^[\w.-]{1,80}$/;
const SLUG = /^[a-z0-9][a-z0-9-]*$/;
// управляющие символы, кроме перевода строки и табуляции
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

function cleanLine(v, max) {
  if (typeof v !== "string") return "";
  return v.replace(CONTROL, "").replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanText(v, max) {
  if (typeof v !== "string") return "";
  return v
    .replace(/\r\n?/g, "\n")
    .replace(CONTROL, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}

// Возвращает одно из:
//   { spam: true }   — тихо «принять» и ничего не записывать (бот)
//   { error: "..." } — показать пользователю
//   { row: {...} }   — готово к записи (без ip_hash)
export function validateReport(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Некорректный запрос" };
  }

  // ловушка: человеку это поле не видно, бот его заполняет
  if (typeof body.website === "string" && body.website.trim() !== "") return { spam: true };
  if (!(Number(body.elapsedMs) >= MIN_FILL_MS)) return { spam: true };

  if (!REPORT_KINDS.includes(body.kind)) return { error: "Неизвестный тип сообщения" };

  const message = cleanText(body.message, 1000);
  if (message.length < 5) return { error: "Опиши подробнее — хотя бы пару слов (от 5 символов)." };

  const contact = cleanLine(body.contact, 120) || null;
  const row = { kind: body.kind, vehicle_slug: null, color_id: null, message, contact, payload: null };

  if (body.kind === "color_error") {
    const vehicleSlug = typeof body.vehicleSlug === "string" ? body.vehicleSlug.trim() : "";
    if (!SLUG.test(vehicleSlug) || vehicleSlug.length > 80) return { error: "Не указана машина" };
    row.vehicle_slug = vehicleSlug;
    if (body.colorId != null && body.colorId !== "") {
      if (typeof body.colorId !== "string" || !PART.test(body.colorId)) return { error: "Некорректный цвет" };
      row.color_id = body.colorId;
    }
    return { row };
  }

  // new_vehicle
  const name = cleanLine(body.name, 120);
  if (name.length < 2) return { error: "Укажи название машины" };
  const category = typeof body.category === "string" ? body.category.trim() : "";
  if (category && (!SLUG.test(category) || category.length > 40)) return { error: "Некорректная категория" };
  const colors = cleanText(body.colors, 600);
  row.payload = { name, category: category || null, colors: colors || null };
  return { row };
}

export function hashIp(ip, salt) {
  return crypto.createHash("sha256").update(`${salt}|${ip}`).digest("hex");
}

// createdAtList — время прошлых репортов ЭТОГО IP за последние сутки.
// Возвращает "hour" | "day" | null.
export function exceedsLimits(createdAtList, now = Date.now()) {
  const times = createdAtList.map((t) => new Date(t).getTime()).filter((t) => Number.isFinite(t));
  const inHour = times.filter((t) => now - t < 60 * 60 * 1000).length;
  if (inHour >= LIMIT_PER_HOUR) return "hour";
  const inDay = times.filter((t) => now - t < 24 * 60 * 60 * 1000).length;
  if (inDay >= LIMIT_PER_DAY) return "day";
  return null;
}
