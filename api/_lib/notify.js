import { buildReportHtml, escapeHtml, reportKeyboard, sendToChat } from "./telegram.js";

// Уведомления: Discord / Slack webhook (простой текст) и Telegram (с кнопками
// «Принять / Отклонить»). Всё необязательно, сбой не мешает принять репорт.

const KIND_LABEL = { color_error: "Ошибка в цвете", new_vehicle: "Предложение машины" };
const ACTION_LABEL = { insert: "создание", upsert: "сохранение", update: "правка", delete: "удаление" };

export function buildReportText(row, site = "") {
  const lines = [`📩 Новый репорт: ${KIND_LABEL[row.kind] || row.kind}`];
  if (row.kind === "color_error") {
    lines.push(`Машина: ${row.vehicle_slug}${row.color_id ? ` / ${row.color_id}` : ""}`);
  } else {
    const p = row.payload || {};
    lines.push(`Название: ${p.name || "—"}`);
    if (p.category) lines.push(`Категория: ${p.category}`);
    if (p.colors) lines.push(`Цвета: ${p.colors}`);
  }
  if (row.message) lines.push(`Сообщение: ${row.message}`);
  if (row.contact) lines.push(`Контакт: ${row.contact}`);
  if (site) lines.push(`Админка: ${site}/admin/reports`);
  return lines.join("\n");
}

async function postWebhook(url, body, fetchImpl) {
  try {
    const r = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3000),
    });
    if (!r.ok) console.error(`[notify] webhook: HTTP ${r.status}`);
    return { name: "webhook", ok: r.ok };
  } catch (err) {
    console.error("[notify] webhook:", err?.message || err);
    return { name: "webhook", ok: false };
  }
}

export async function notifyReport(row, site, env = process.env, fetchImpl = globalThis.fetch) {
  const jobs = [];

  const hook = (env.REPORT_WEBHOOK_URL || "").trim();
  if (hook) {
    const text = buildReportText(row, site).slice(0, 1900);
    // content — Discord, text — Slack; лишнее поле каждый сервис игнорирует
    jobs.push(postWebhook(hook, { content: text, text, allowed_mentions: { parse: [] } }, fetchImpl));
  }

  if ((env.TELEGRAM_BOT_TOKEN || "").trim() && (env.TELEGRAM_CHAT_ID || "").trim()) {
    jobs.push(
      sendToChat(buildReportHtml(row, site), { reply_markup: reportKeyboard(row, site) }, env, fetchImpl).then((r) => ({
        name: "telegram",
        ok: r.ok,
      }))
    );
  }
  return Promise.all(jobs);
}

// Лента правок админов в чат (включается TELEGRAM_AUDIT_FEED=1), без звука.
export async function notifyAudit(entries, env = process.env, fetchImpl = globalThis.fetch) {
  if (env.TELEGRAM_AUDIT_FEED !== "1" || !entries?.length) return null;
  if (!(env.TELEGRAM_BOT_TOKEN || "").trim() || !(env.TELEGRAM_CHAT_ID || "").trim()) return null;
  const lines = entries.slice(0, 10).map(
    (e) =>
      `✏️ <b>${escapeHtml(e.edited_by || "?")}</b> · ${escapeHtml(e.table_name)} · <code>${escapeHtml(e.row_key ?? "—")}</code> — ${
        ACTION_LABEL[e.action] || escapeHtml(e.action)
      }`
  );
  if (entries.length > 10) lines.push(`…и ещё ${entries.length - 10}`);
  return sendToChat(lines.join("\n"), { disable_notification: true }, env, fetchImpl);
}
