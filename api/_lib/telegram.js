import crypto from "node:crypto";

// Общие помощники для Telegram: вызов Bot API, HTML-разметка репортов,
// кнопки и проверка прав. Чистые функции проверяются тестами.

export const STATUS_LABEL = { new: "🆕 Новый", accepted: "✅ Принято", rejected: "❌ Отклонено" };
const KIND_LABEL = { color_error: "Ошибка в цвете", new_vehicle: "Предложение машины" };
const CALLBACK_STATUS = { a: "accepted", r: "rejected", n: "new" };

export function escapeHtml(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Адрес сайта: VITE_SITE_URL или по заголовкам запроса.
export function siteUrl(req, env = process.env) {
  const proto = req?.headers?.["x-forwarded-proto"] || "https";
  const host = req?.headers?.["x-forwarded-host"] || req?.headers?.host;
  return (env.VITE_SITE_URL || (host ? `${proto}://${host}` : "")).replace(/\/+$/, "");
}

export function buildReportHtml(row, site = "", status = row.status) {
  const lines = [`📩 <b>${escapeHtml(KIND_LABEL[row.kind] || row.kind)}</b>${row.id != null ? ` #${row.id}` : ""}`];
  if (row.kind === "color_error") {
    lines.push(`Машина: <code>${escapeHtml(row.vehicle_slug)}${row.color_id ? ` / ${escapeHtml(row.color_id)}` : ""}</code>`);
  } else {
    const p = row.payload || {};
    lines.push(`Название: <b>${escapeHtml(p.name || "—")}</b>`);
    if (p.category) lines.push(`Категория: ${escapeHtml(p.category)}`);
    if (p.colors) lines.push(`Цвета: ${escapeHtml(p.colors)}`);
  }
  if (row.message) lines.push(`Сообщение: ${escapeHtml(row.message)}`);
  if (row.contact) lines.push(`Контакт: ${escapeHtml(row.contact)}`);
  if (status && status !== "new") {
    lines.push("", `<b>${STATUS_LABEL[status] || escapeHtml(status)}</b>${row.edited_by ? ` — ${escapeHtml(row.edited_by)}` : ""}`);
  }
  return lines.join("\n");
}

// Кнопки под сообщением. Без id (репорт ещё не сохранён) кнопок нет.
// Ссылки добавляются только для https: Telegram отклоняет весь запрос из-за плохой ссылки.
export function reportKeyboard(row, site = "", status = row.status || "new") {
  if (row.id == null) return undefined;
  const rows = [
    status === "new"
      ? [
          { text: "✅ Принять", callback_data: `r:a:${row.id}` },
          { text: "❌ Отклонить", callback_data: `r:r:${row.id}` },
        ]
      : [{ text: "↩️ Вернуть в новые", callback_data: `r:n:${row.id}` }],
  ];
  if (site.startsWith("https://")) {
    const links = [{ text: "🔗 Админка", url: `${site}/admin/reports` }];
    if (row.kind === "color_error" && row.vehicle_slug) {
      const q = row.color_id ? `?color=${encodeURIComponent(row.color_id)}` : "";
      links.push({ text: "🚗 На сайте", url: `${site}/vehicle/${encodeURIComponent(row.vehicle_slug)}${q}` });
    }
    rows.push(links);
  }
  return { inline_keyboard: rows };
}

// "r:a:12" → { status: "accepted", id: 12 }
export function parseCallback(data) {
  const m = /^r:([arn]):(\d{1,15})$/.exec(String(data || ""));
  return m ? { status: CALLBACK_STATUS[m[1]], id: Number(m[2]) } : null;
}

export function parseAdminIds(env = process.env) {
  return new Set(String(env.TELEGRAM_ADMIN_IDS || "").split(",").map((s) => s.trim()).filter(Boolean));
}

// Команды и кнопки принимаем только из нашего чата. Если задан TELEGRAM_ADMIN_IDS,
// нажимать может только он. Без списка разрешён только личный чат: в группе кнопки
// мог бы нажать любой участник.
export function authorize({ chat, from }, env = process.env) {
  if (!chat || String(chat.id) !== String(env.TELEGRAM_CHAT_ID || "")) return false;
  const ids = parseAdminIds(env);
  if (ids.size > 0) return ids.has(String(from?.id));
  return chat.type === "private";
}

export function safeEqual(a, b) {
  const ba = Buffer.from(String(a ?? ""));
  const bb = Buffer.from(String(b ?? ""));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

// Вызов Bot API. Никогда не бросает исключение: { ok, data }.
export async function tgCall(method, payload, env = process.env, fetchImpl = globalThis.fetch) {
  const token = (env.TELEGRAM_BOT_TOKEN || "").trim();
  if (!token) return { ok: false, data: null };
  try {
    const r = await fetchImpl(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3500),
    });
    const data = typeof r.json === "function" ? await r.json().catch(() => ({})) : {};
    const ok = r.ok && data?.ok !== false;
    if (!ok) console.error(`[telegram] ${method}: HTTP ${r.status} ${data?.description || ""}`);
    return { ok, data };
  } catch (err) {
    console.error(`[telegram] ${method}:`, err?.message || err);
    return { ok: false, data: null };
  }
}

// Сообщение в наш чат (с поддержкой темы форума TELEGRAM_THREAD_ID).
export function sendToChat(text, extra = {}, env = process.env, fetchImpl = globalThis.fetch) {
  const chat = (env.TELEGRAM_CHAT_ID || "").trim();
  if (!chat) return Promise.resolve({ ok: false, data: null });
  const thread = Number(env.TELEGRAM_THREAD_ID);
  return tgCall(
    "sendMessage",
    {
      chat_id: chat,
      text: text.slice(0, 4000),
      parse_mode: "HTML",
      disable_web_page_preview: true,
      ...(Number.isInteger(thread) && thread > 0 ? { message_thread_id: thread } : {}),
      ...extra,
    },
    env,
    fetchImpl
  );
}
