import { supabase, parseJson } from "./_lib/db.js";
import {
  DIV,
  STATUS_LABEL,
  authorize,
  buildReportHtml,
  escapeHtml,
  parseCallback,
  reportKeyboard,
  safeEqual,
  siteUrl,
  tgCall,
} from "./_lib/telegram.js";
import {
  auditText,
  carKeyboard,
  carText,
  findKeyboard,
  findText,
  healthText,
  menuKeyboard,
  menuText,
  navKeyboard,
  parseNav,
  photoUrl,
  recentText,
  statsText,
  topText,
} from "./_lib/botviews.js";
import { searchCatalog } from "../src/lib/search.js";
import { getCategory } from "../src/data/categories.js";

// Вебхук Telegram-бота: кнопки «Принять / Отклонить» под репортами, меню и
// команды /menu /new /stats /find /car /top /recent /health /audit /help.
// Настраивается один раз: node scripts/telegram-setup.mjs
// Защита: секрет вебхука (заголовок Telegram), проверка чата и списка
// TELEGRAM_ADMIN_IDS. Telegram всегда получает 200, иначе он повторяет доставку.

const COLUMNS = "id,created_at,kind,vehicle_slug,color_id,message,contact,payload,status,edited_by";
const VEHICLE_COLS = "slug,name,category,tags,image,colors,created_at,edited_at,edited_by";

// ── данные ──────────────────────────────────────────────────────────────

async function getReport(id) {
  const r = await supabase(`reports?id=eq.${id}&select=${COLUMNS}&limit=1`, { method: "GET" });
  return r.status < 400 ? parseJson(r.text)?.[0] || null : null;
}

// null — каталог не загрузился (чтобы не путать с «пусто»).
async function loadVehicles({ order = "name.asc", limit = 5000 } = {}) {
  const r = await supabase(`vehicles?select=${VEHICLE_COLS}&order=${order}&limit=${limit}`, { method: "GET" });
  return r.status < 400 ? parseJson(r.text) || [] : null;
}

async function loadTags() {
  const r = await supabase("tags?select=id,label&limit=1000", { method: "GET" });
  return r.status < 400 ? parseJson(r.text) || [] : [];
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

// ── отправка ────────────────────────────────────────────────────────────

// Контекст ответа: куда писать (чат + тема форума) и адрес сайта.
function makeCtx(chatId, threadId, site) {
  const thread = threadId ? { message_thread_id: threadId } : {};
  return {
    site,
    reply: (text, extra = {}) =>
      tgCall("sendMessage", {
        chat_id: chatId,
        text: text.slice(0, 4000),
        parse_mode: "HTML",
        disable_web_page_preview: true,
        ...thread,
        ...extra,
      }),
    photo: (url, caption, extra = {}) =>
      tgCall("sendPhoto", { chat_id: chatId, photo: url, caption, parse_mode: "HTML", ...thread, ...extra }),
  };
}

// ── команды ─────────────────────────────────────────────────────────────

async function cmdNew({ reply, site }) {
  const r = await supabase(`reports?status=eq.new&select=${COLUMNS}&order=created_at.desc&limit=6`, { method: "GET" });
  const rows = r.status < 400 ? parseJson(r.text) || [] : [];
  if (rows.length === 0) {
    await reply(`📭 <b>Новых репортов нет</b>\n${DIV}\nВсё разобрано 🎉`, { reply_markup: navKeyboard() });
    return;
  }
  const shown = rows.slice(0, 5);
  await reply(
    `📬 <b>Новые репорты</b> · ${rows.length > 5 ? "больше 5" : rows.length}\n${DIV}\nПоказываю ${shown.length} свежих 👇`
  );
  for (const row of shown) await reply(buildReportHtml(row, site), { reply_markup: reportKeyboard(row, site) });
}

async function cmdStats({ reply }) {
  const [reports, vehicles] = await Promise.all([
    supabase("reports?select=status&limit=5000", { method: "GET" }),
    loadVehicles(),
  ]);
  const counts = { new: 0, accepted: 0, rejected: 0 };
  for (const x of parseJson(reports.text) || []) if (x.status in counts) counts[x.status] += 1;
  const list = vehicles || [];
  await reply(
    statsText({
      counts,
      vehicles: list.length,
      colors: list.reduce((n, v) => n + (v.colors?.length || 0), 0),
      noPhoto: list.reduce((n, v) => n + (v.colors || []).filter((c) => !c.image).length, 0),
      noCover: list.filter((v) => !v.image).length,
    }),
    { reply_markup: navKeyboard() }
  );
}

async function cmdHealth({ reply, site }) {
  const vehicles = await loadVehicles();
  if (!vehicles) return void (await reply("⚠️ Не удалось загрузить каталог.", { reply_markup: navKeyboard() }));
  const rows = site.startsWith("https://") ? [[{ text: "🔗 Открыть админку", url: `${site}/admin` }]] : [];
  await reply(healthText(vehicles), { reply_markup: navKeyboard(rows) });
}

async function cmdTop({ reply }) {
  const [v, c, vehicles] = await Promise.all([
    supabase("hits?kind=eq.vehicle&select=key,count&order=count.desc&limit=8", { method: "GET" }),
    supabase("hits?kind=eq.color&select=key,count&order=count.desc&limit=6", { method: "GET" }),
    loadVehicles(),
  ]);
  const rows = (r) => (r.status < 400 ? parseJson(r.text) || [] : []);
  await reply(topText({ vehicleHits: rows(v), colorHits: rows(c), vehicles: vehicles || [] }), {
    reply_markup: navKeyboard(),
  });
}

async function cmdRecent({ reply }) {
  const list = await loadVehicles({ order: "created_at.desc", limit: 8 });
  if (!list) return void (await reply("⚠️ Не удалось загрузить каталог.", { reply_markup: navKeyboard() }));
  await reply(recentText(list), { reply_markup: navKeyboard() });
}

async function cmdAudit({ reply }) {
  const r = await supabase(
    "audit_log?select=created_at,edited_by,table_name,row_key,action&order=created_at.desc&limit=100",
    { method: "GET" }
  );
  if (r.status >= 400) {
    await reply("⚠️ Журнал недоступен. Если таблицы ещё нет — выполни <code>sql/audit-log.sql</code>.", {
      reply_markup: navKeyboard(),
    });
    return;
  }
  await reply(auditText(parseJson(r.text) || []), { reply_markup: navKeyboard() });
}

async function cmdFind(query, { reply }) {
  if (!query) {
    await reply("🔎 Что искать? Например: <code>/find бмв</code>, <code>/find чёрный</code> или <code>/find FF0000</code>", {
      reply_markup: navKeyboard(),
    });
    return;
  }
  const [vehicles, tags] = await Promise.all([loadVehicles(), loadTags()]);
  if (!vehicles) return void (await reply("⚠️ Не удалось загрузить каталог.", { reply_markup: navKeyboard() }));
  const found = searchCatalog(vehicles, tags, query, { categoryName: (slug) => getCategory(slug)?.name || "" });
  await reply(findText(found, query), { reply_markup: findKeyboard(found.results) });
}

async function cmdCar(query, { reply, photo, site }) {
  if (!query) {
    await reply("🚗 Какую машину показать? Например: <code>/car bmw-m5-f90</code> или <code>/car бмв м5</code>", {
      reply_markup: navKeyboard(),
    });
    return;
  }
  const [vehicles, tags] = await Promise.all([loadVehicles(), loadTags()]);
  if (!vehicles) return void (await reply("⚠️ Не удалось загрузить каталог.", { reply_markup: navKeyboard() }));

  let v = vehicles.find((x) => x.slug === query.toLowerCase());
  if (!v) {
    const found = searchCatalog(vehicles, tags, query, { categoryName: (slug) => getCategory(slug)?.name || "" });
    v = found.results[0]?.v;
  }
  if (!v) {
    await reply(`😕 По запросу «${escapeHtml(query)}» ничего нет. Попробуй <code>/find</code>.`, { reply_markup: navKeyboard() });
    return;
  }

  const labels = new Map(tags.map((t) => [t.id, t.label]));
  const tagLabels = (v.tags || []).map((id) => labels.get(id)).filter(Boolean);
  const markup = carKeyboard(v, site);

  const img = photoUrl(v.image, site);
  if (img) {
    // подпись к фото ограничена 1024 символами, поэтому цветов меньше
    const sent = await photo(img, carText(v, tagLabels, { maxColors: 8, limit: 1000 }), { reply_markup: markup });
    if (sent.ok) return;
  }
  await reply(carText(v, tagLabels, { maxColors: 25 }), { reply_markup: markup });
}

// Единая точка: и текстовые команды, и кнопки меню приходят сюда.
async function runCommand(cmd, arg, ctx) {
  switch (cmd) {
    case "start":
    case "menu":
    case "help":
      return void (await ctx.reply(menuText(), { reply_markup: menuKeyboard(ctx.site) }));
    case "new":
      return cmdNew(ctx);
    case "stats":
      return cmdStats(ctx);
    case "health":
      return cmdHealth(ctx);
    case "top":
      return cmdTop(ctx);
    case "recent":
      return cmdRecent(ctx);
    case "audit":
      return cmdAudit(ctx);
    case "find":
      return cmdFind(arg, ctx);
    case "car":
      return cmdCar(arg, ctx);
    default:
      return void (await ctx.reply(menuText(), { reply_markup: menuKeyboard(ctx.site) }));
  }
}

// ── обработчики апдейтов ────────────────────────────────────────────────

async function onCallback(cq, site) {
  const answer = (text, alert = false) =>
    tgCall("answerCallbackQuery", { callback_query_id: cq.id, text, show_alert: alert });

  if (!authorize({ chat: cq.message?.chat, from: cq.from })) {
    await answer("Нет доступа. Задай TELEGRAM_ADMIN_IDS.", true);
    return;
  }

  // кнопки меню и карточки машин
  const nav = parseNav(cq.data);
  if (nav) {
    await answer();
    const ctx = makeCtx(cq.message.chat.id, cq.message.message_thread_id, site);
    if (nav.type === "cmd") await runCommand(nav.cmd, "", ctx);
    else await runCommand("car", nav.slug, ctx);
    return;
  }

  // кнопки под репортами
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
  const text = String(msg.text || "").trim();
  const ctx = makeCtx(msg.chat.id, msg.message_thread_id, site);

  // "/find@my_bot бмв м5" → cmd "find", arg "бмв м5"
  const m = /^\/([A-Za-z_]+)(?:@\w+)?(?:\s+([\s\S]*))?$/.exec(text);
  if (!m) {
    // в личном чате обычный текст — это поисковый запрос; в группе молчим
    if (msg.chat.type === "private" && text) await runCommand("find", text, ctx);
    return;
  }
  await runCommand(m[1].toLowerCase(), (m[2] || "").trim(), ctx);
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
