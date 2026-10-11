import { supabase, parseJson } from "./_lib/db.js";
import { escapeHtml, safeEqual, sendToChat, siteUrl } from "./_lib/telegram.js";

// Утренняя сводка в Telegram (Vercel Cron, см. vercel.json). Отправляет
// сообщение только если есть невыполненные репорты. Защита: CRON_SECRET —
// Vercel сам подставляет его в заголовок Authorization.

const DAY = 24 * 60 * 60 * 1000;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const secret = process.env.CRON_SECRET || "";
  if (!secret) {
    res.status(500).json({ error: "Задай CRON_SECRET в переменных окружения." });
    return;
  }
  if (!safeEqual(req.headers?.authorization, `Bearer ${secret}`)) {
    res.status(401).json({ error: "Нет доступа" });
    return;
  }
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    res.status(200).json({ sent: false, reason: "Telegram не настроен" });
    return;
  }

  const r = await supabase("reports?status=eq.new&select=id,created_at,kind&order=created_at.asc&limit=500", { method: "GET" });
  if (r.status >= 400) {
    res.status(502).json({ error: `Supabase ${r.status}` });
    return;
  }
  const rows = parseJson(r.text) || [];
  if (rows.length === 0) {
    res.status(200).json({ sent: false, reason: "Новых репортов нет" });
    return;
  }

  const now = Date.now();
  const oldestDays = Math.floor((now - new Date(rows[0].created_at).getTime()) / DAY);
  const fresh = rows.filter((x) => now - new Date(x.created_at).getTime() < DAY).length;
  const colorErrors = rows.filter((x) => x.kind === "color_error").length;
  const site = siteUrl(req);

  const lines = [
    "☀️ <b>Утренняя сводка</b>",
    `Ждут решения: <b>${rows.length}</b> (ошибок в цвете: ${colorErrors}, машин: ${rows.length - colorErrors})`,
    `За последние сутки: ${fresh}`,
  ];
  if (oldestDays >= 1) lines.push(`Самый старый ждёт ${oldestDays} дн.`);
  lines.push("", "Отправь /new, чтобы разобрать их кнопками.");
  if (site) lines.push(escapeHtml(`${site}/admin/reports`));

  const sent = await sendToChat(lines.join("\n"));
  res.status(200).json({ sent: sent.ok, pending: rows.length });
}
