import { supabase, parseJson } from "./_lib/db.js";
import {
  STATUS_LABEL,
  authorize,
  buildReportHtml,
  parseCallback,
  reportKeyboard,
  safeEqual,
  siteUrl,
  tgCall,
} from "./_lib/telegram.js";

// Вебхук Telegram-бота: кнопки «Принять / Отклонить» под репортами и команды
// /new, /stats, /help. Настраивается один раз: node scripts/telegram-setup.mjs
// Защита: секрет вебхука (заголовок Telegram), проверка чата и списка
// TELEGRAM_ADMIN_IDS. Telegram всегда получает 200, иначе он повторяет доставку.

const COLUMNS = "id,created_at,kind,vehicle_slug,color_id,message,contact,payload,status,edited_by";

const HELP =
  "Команды:\n/new — новые репорты с кнопками\n/stats — сводка по каталогу и репортам\n/help — эта подсказка";

async function getReport(id) {
  const r = await supabase(`reports?id=eq.${id}&select=${COLUMNS}&limit=1`, { method: "GET" });
  return r.status < 400 ? parseJson(r.text)?.[0] || null : null;
}

// Меняет статус и пишет в журнал так же, как api/admin-db.js, поэтому
// «Откатить» в админке работает и для решений из Telegram.
async function setStatus(row, status, who) {
  if (row.status === status) return true;
  const patch = { status, edited_by: who };
  const r = await supabase(`reports?id=eq.${row.id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(patch),
  });
  if (r.status >= 400) {
    console.error("[telegram] статус не сохранён:", r.status, r.text.slice(0, 200));
    return false;
  }
  await supabase("audit_log", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify([
      { table_name: "reports", row_key: String(row.id), action: "update", edited_by: who, old_data: row, new_data: patch },
    ]),
  });
  return true;
}

function whoIs(from) {
  return `Telegram: ${from?.username ? `@${from.username}` : from?.first_name || from?.id || "?"}`;
}

async function onCallback(cq, site) {
  const answer = (text, alert = false) =>
    tgCall("answerCallbackQuery", { callback_query_id: cq.id, text, show_alert: alert });

  if (!authorize({ chat: cq.message?.chat, from: cq.from })) {
    await answer("Нет доступа. Задай TELEGRAM_ADMIN_IDS.", true);
    return;
  }
  const parsed = parseCallback(cq.data);
  if (!parsed) return void (await answer("Неизвестная кнопка"));

  const row = await getReport(parsed.id);
  if (!row) return void (await answer("Репорт не найден (возможно, удалён)", true));

  const who = whoIs(cq.from);
  if (!(await setStatus(row, parsed.status, who))) return void (await answer("Не удалось сохранить", true));

  const updated = { ...row, status: parsed.status, edited_by: who };
  await answer(STATUS_LABEL[parsed.status]);
  await tgCall("editMessageText", {
    chat_id: cq.message.chat.id,
    message_id: cq.message.message_id,
    text: buildReportHtml(updated, site),
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: reportKeyboard(updated, site),
  });
}

async function onMessage(msg, site) {
  if (!authorize({ chat: msg.chat, from: msg.from })) return;
  const cmd = String(msg.text || "").trim().split(/[\s@]/)[0].toLowerCase();
  const reply = (text, extra = {}) =>
    tgCall("sendMessage", {
      chat_id: msg.chat.id,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      ...(msg.message_thread_id ? { message_thread_id: msg.message_thread_id } : {}),
      ...extra,
    });

  if (cmd === "/start" || cmd === "/help") {
    await reply(HELP);
  } else if (cmd === "/new") {
    const r = await supabase(`reports?status=eq.new&select=${COLUMNS}&order=created_at.desc&limit=6`, { method: "GET" });
    const rows = r.status < 400 ? parseJson(r.text) || [] : [];
    if (rows.length === 0) return void (await reply("Новых репортов нет 🎉"));
    const shown = rows.slice(0, 5);
    await reply(`Новых репортов: ${rows.length > 5 ? "больше 5" : rows.length}. Показываю ${shown.length} свежих:`);
    for (const row of shown) await reply(buildReportHtml(row, site), { reply_markup: reportKeyboard(row, site) });
  } else if (cmd === "/stats") {
    const [reports, vehicles] = await Promise.all([
      supabase("reports?select=status&limit=5000", { method: "GET" }),
      supabase("vehicles?select=image,colors&limit=5000", { method: "GET" }),
    ]);
    const counts = { new: 0, accepted: 0, rejected: 0 };
    for (const x of parseJson(reports.text) || []) if (x.status in counts) counts[x.status] += 1;
    const list = vehicles.status < 400 ? parseJson(vehicles.text) || [] : [];
    const colors = list.reduce((n, v) => n + (v.colors?.length || 0), 0);
    const noPhoto = list.reduce((n, v) => n + (v.colors || []).filter((c) => !c.image).length, 0);
    const noCover = list.filter((v) => !v.image).length;
    await reply(
      [
        "📊 <b>Сводка</b>",
        `Репорты: 🆕 ${counts.new} · ✅ ${counts.accepted} · ❌ ${counts.rejected}`,
        `Машин: ${list.length}, цветов: ${colors}`,
        `Без обложки: ${noCover}, цветов без скриншота: ${noPhoto}`,
      ].join("\n")
    );
  } else {
    await reply(HELP);
  }
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET || "";
  if (!secret || !process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    res.status(500).json({ error: "Бот не настроен: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TELEGRAM_WEBHOOK_SECRET." });
    return;
  }
  if (!safeEqual(req.headers?.["x-telegram-bot-api-secret-token"], secret)) {
    res.status(401).json({ error: "Нет доступа" });
    return;
  }

  const update = req.body && typeof req.body === "object" ? req.body : {};
  const site = siteUrl(req);
  try {
    if (update.callback_query) await onCallback(update.callback_query, site);
    else if (update.message?.text) await onMessage(update.message, site);
  } catch (err) {
    console.error("[telegram]", err?.message || err);
  }
  res.status(200).json({ ok: true });
}
