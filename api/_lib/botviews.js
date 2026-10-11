import { getCategory } from "../../src/data/categories.js";
import { colorFamily } from "../../src/lib/color.js";
import { analyzeCatalog } from "../../src/lib/catalogHealth.js";
import { formatRelativeTime } from "../../src/lib/textUtils.js";
import { DIV, bar, escapeHtml as esc } from "./telegram.js";

// Оформление ответов бота: чистые функции «данные → HTML для Telegram»,
// без сети (проверяются tests/botviews.test.mjs). Стиль: эмодзи, разделители
// и прогресс-бары ▰▱.

const MEDALS = ["🥇", "🥈", "🥉"];
const NUMS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣"];
const NEW_DAYS = 14;

const FAMILY_EMOJI = {
  red: "🟥", orange: "🟧", yellow: "🟨", green: "🟩", cyan: "🩵", blue: "🟦",
  purple: "🟪", pink: "🩷", brown: "🟫", white: "⬜", black: "⬛", gray: "🩶",
};

// Цветной квадратик-эмодзи по оттенку hex.
export function swatch(hex) {
  return FAMILY_EMOJI[colorFamily(hex)] || "▫️";
}

function hexesOf(color) {
  return (color?.hexes ?? [color?.hex]).filter(Boolean);
}

const rel = (iso) => formatRelativeTime(iso) || "—";
const pct = (n, total) => (total > 0 ? Math.round((n / total) * 100) : 0);

// Режет по строкам, чтобы не порвать HTML-теги.
function fit(lines, limit) {
  const out = [];
  let len = 0;
  for (const line of lines) {
    if (len + line.length + 1 > limit - 4) {
      out.push("…");
      break;
    }
    out.push(line);
    len += line.length + 1;
  }
  return out.join("\n");
}

// ── меню ────────────────────────────────────────────────────────────────

export const MENU_CMDS = new Set(["new", "stats", "top", "recent", "health", "audit", "menu", "help"]);

export function menuText() {
  return [
    "🧭 <b>OSNOVA · пульт управления</b>",
    DIV,
    "Выбери раздел кнопкой или командой:",
    "",
    "🔎 <code>/find бмв</code> — поиск машины",
    "🚗 <code>/car bmw-m5-f90</code> — карточка с цветами",
    "🔥 /top — популярное",
    "🆕 /recent — новые машины",
    "🩺 /health — здоровье каталога",
    "📜 /audit — правки админов",
    "📬 /new — новые репорты",
    "📊 /stats — сводка",
    "",
    "💡 В личном чате можно просто написать название — поищу.",
  ].join("\n");
}

export function menuKeyboard(site = "") {
  const rows = [
    [
      { text: "📬 Репорты", callback_data: "m:new" },
      { text: "📊 Сводка", callback_data: "m:stats" },
    ],
    [
      { text: "🔥 Топ", callback_data: "m:top" },
      { text: "🆕 Новые машины", callback_data: "m:recent" },
    ],
    [
      { text: "🩺 Здоровье", callback_data: "m:health" },
      { text: "📜 Журнал", callback_data: "m:audit" },
    ],
  ];
  if (site.startsWith("https://")) rows.push([{ text: "🔗 Админка", url: `${site}/admin` }]);
  return { inline_keyboard: rows };
}

export function navKeyboard(extraRows = []) {
  return { inline_keyboard: [...extraRows, [{ text: "🧭 Меню", callback_data: "m:menu" }]] };
}

// "m:top" → { type: "cmd", cmd: "top" }, "v:bmw-m5" → { type: "car", slug }
export function parseNav(data) {
  const s = String(data || "");
  let m = /^m:([a-z]{2,10})$/.exec(s);
  if (m && MENU_CMDS.has(m[1])) return { type: "cmd", cmd: m[1] };
  m = /^v:([a-z0-9][a-z0-9-]{0,60})$/.exec(s);
  if (m) return { type: "car", slug: m[1] };
  return null;
}

// ── сводка ──────────────────────────────────────────────────────────────

export function statsText({ counts, vehicles = 0, colors = 0, noPhoto = 0, noCover = 0 }) {
  const total = counts.new + counts.accepted + counts.rejected;
  const row = (icon, label, n) => `${icon} ${label}\n    ${bar(n, total)} <b>${n}</b>`;
  return [
    "📊 <b>Сводка OSNOVA</b>",
    DIV,
    `📩 <b>Репорты</b> · всего ${total}`,
    row("🆕", "Новые", counts.new),
    row("✅", "Принятые", counts.accepted),
    row("❌", "Отклонённые", counts.rejected),
    DIV,
    `🚗 Машин: <b>${vehicles}</b> · 🎨 цветов: <b>${colors}</b>`,
    `🖼 Обложки\n    ${bar(vehicles - noCover, vehicles)} ${pct(vehicles - noCover, vehicles)}%`,
    `📸 Скриншоты цветов\n    ${bar(colors - noPhoto, colors)} ${pct(colors - noPhoto, colors)}%`,
  ].join("\n");
}

// ── здоровье каталога ───────────────────────────────────────────────────

export function healthText(vehicles) {
  const r = analyzeCatalog(vehicles);
  if (r.total === 0) return ["🩺 <b>Здоровье каталога</b>", DIV, "Каталог пока пуст."].join("\n");

  const colorsTotal = vehicles.reduce((n, v) => n + (v.colors?.length || 0), 0);
  const noPhoto = r.colorsNoPhoto.reduce((n, x) => n + x.count, 0);
  const metrics = [
    ["🖼", "Обложки", r.total - r.noCover.length, r.total],
    ["🏷", "Теги", r.total - r.noTags.length, r.total],
    ["📸", "Скриншоты цветов", colorsTotal - noPhoto, colorsTotal],
  ];
  const score = Math.round(metrics.reduce((s, m) => s + pct(m[2], m[3]), 0) / metrics.length);
  const grade = score >= 90 ? "🟢" : score >= 70 ? "🟡" : "🔴";

  const lines = [
    "🩺 <b>Здоровье каталога</b>",
    DIV,
    `${grade} Общая оценка: <b>${score}%</b>`,
    `    ${bar(score, 100, 12)}`,
    DIV,
  ];
  for (const [icon, label, ok, total] of metrics) {
    lines.push(`${icon} ${label}\n    ${bar(ok, total)} ${pct(ok, total)}% · ${ok} из ${total}`);
  }
  lines.push(DIV);

  const problems = [];
  if (r.noColors.length) problems.push(`🚫 Без цветов: <b>${r.noColors.length}</b>`);
  if (r.duplicateHex.length) problems.push(`♊ Одинаковый hex внутри машины: <b>${r.duplicateHex.length}</b>`);
  if (problems.length) lines.push(...problems);
  else lines.push("✨ Дублей и пустых машин нет");

  if (r.noCover.length) {
    lines.push("", "🖼 <b>Без обложки</b> (первые 5):");
    for (const v of r.noCover.slice(0, 5)) lines.push(`  • ${esc(v.name)}`);
    if (r.noCover.length > 5) lines.push(`  …и ещё ${r.noCover.length - 5}`);
  }
  return lines.join("\n");
}

// ── популярное ──────────────────────────────────────────────────────────

export function topText({ vehicleHits = [], colorHits = [], vehicles = [] }) {
  const bySlug = new Map(vehicles.map((v) => [v.slug, v]));
  const veh = vehicleHits
    .map((h) => ({ v: bySlug.get(h.key), n: Number(h.count) || 0 }))
    .filter((x) => x.v)
    .slice(0, 8);
  const cols = colorHits
    .map((h) => {
      const key = String(h.key);
      const i = key.indexOf(":");
      if (i <= 0) return null;
      const v = bySlug.get(key.slice(0, i));
      const c = v?.colors?.find((x) => x.id === key.slice(i + 1));
      return v && c ? { v, c, n: Number(h.count) || 0 } : null;
    })
    .filter(Boolean)
    .slice(0, 6);

  const lines = ["🔥 <b>Популярное</b>", DIV];
  if (veh.length === 0 && cols.length === 0) {
    lines.push("Данных пока нет: счётчики растут, когда посетители открывают машины и копируют цвета.");
    return lines.join("\n");
  }
  if (veh.length) {
    const max = Math.max(...veh.map((x) => x.n));
    lines.push("🚗 <b>Машины по просмотрам</b>");
    veh.forEach((x, i) => lines.push(`${MEDALS[i] || `${i + 1}.`} ${esc(x.v.name)}`, `    ${bar(x.n, max)} ${x.n}`));
  }
  if (cols.length) {
    const max = Math.max(...cols.map((x) => x.n));
    lines.push("", "🎨 <b>Цвета по копированиям</b>");
    cols.forEach((x, i) =>
      lines.push(`${MEDALS[i] || `${i + 1}.`} ${swatch(hexesOf(x.c)[0])} ${esc(x.v.name)} · ${esc(x.c.name)}`, `    ${bar(x.n, max)} ${x.n}`)
    );
  }
  return lines.join("\n");
}

// ── новые машины ────────────────────────────────────────────────────────

export function recentText(list, now = Date.now()) {
  const lines = ["🆕 <b>Новые машины</b>", DIV];
  if (!list.length) {
    lines.push("Пока ничего не добавлено.");
    return lines.join("\n");
  }
  for (const v of list.slice(0, 8)) {
    const fresh = v.created_at && now - new Date(v.created_at).getTime() < NEW_DAYS * 86400000;
    const cat = getCategory(v.category)?.name || v.category || "—";
    lines.push(
      `${fresh ? "🆕" : "🚗"} <b>${esc(v.name)}</b>`,
      `    📁 ${esc(cat)} · 🎨 ${v.colors?.length || 0} · 🕒 ${rel(v.created_at)}`
    );
  }
  return lines.join("\n");
}

// ── журнал правок ───────────────────────────────────────────────────────

const ACTION = {
  insert: ["➕", "создание"],
  upsert: ["💾", "сохранение"],
  update: ["✏️", "правка"],
  delete: ["🗑", "удаление"],
};

export function auditText(rows) {
  const lines = ["📜 <b>Журнал правок</b>", DIV];
  if (!rows.length) {
    lines.push("Записей пока нет.");
    return lines.join("\n");
  }
  for (const r of rows.slice(0, 8)) {
    const [icon, label] = ACTION[r.action] || ["•", esc(r.action)];
    lines.push(
      `${icon} <b>${esc(r.edited_by || "?")}</b> · ${esc(r.table_name)} · <code>${esc(r.row_key ?? "—")}</code>`,
      `    ${label} · ${rel(r.created_at)}`
    );
  }
  const byEditor = new Map();
  for (const r of rows) byEditor.set(r.edited_by || "?", (byEditor.get(r.edited_by || "?") || 0) + 1);
  const top = [...byEditor.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  lines.push(DIV, `👥 <b>Активность</b> · последние ${rows.length} правок`);
  for (const [name, n] of top) lines.push(`${esc(name)}\n    ${bar(n, top[0][1])} ${n}`);
  return lines.join("\n");
}

// ── поиск и карточка машины ─────────────────────────────────────────────

export function findText({ results, used, fuzzy }, query) {
  const lines = [`🔎 <b>Поиск: «${esc(query)}»</b>`, DIV];
  if (!results.length) {
    lines.push("😕 Ничего не нашёл.", "Попробуй другое название, hex (<code>FF0000</code>) или русское имя марки.");
    return lines.join("\n");
  }
  const typed = String(query).trim().toLowerCase();
  if (fuzzy) lines.push("🤔 Точных совпадений нет. Возможно, вы искали:", "");
  else if (used && used !== typed) lines.push(`↪️ Показано для «${esc(used)}»`, "");
  results.slice(0, 6).forEach((item, i) => {
    const sw = (item.v.colors || []).slice(0, 6).map((c) => swatch(hexesOf(c)[0])).join("");
    lines.push(`${NUMS[i]} <b>${esc(item.v.name)}</b> ${sw}`, `    └ ${esc(item.hint || "")}`);
  });
  lines.push("", "👇 Нажми на машину, чтобы открыть карточку");
  return lines.join("\n");
}

export function findKeyboard(results) {
  const buttons = results
    .slice(0, 6)
    .filter((r) => /^[a-z0-9][a-z0-9-]{0,60}$/.test(r.v.slug))
    .map((r) => ({ text: `🚗 ${String(r.v.name).slice(0, 26)}`, callback_data: `v:${r.v.slug}` }));
  const rows = [];
  for (let i = 0; i < buttons.length; i += 2) rows.push(buttons.slice(i, i + 2));
  return navKeyboard(rows);
}

function colorLine(c) {
  const hexes = hexesOf(c);
  const sw = hexes.slice(0, 2).map(swatch).join("");
  const codes = hexes.map((h) => `<code>${esc(h)}</code>`).join(" + ");
  const accent = c.accentHex ? ` · вставки <code>${esc(c.accentHex)}</code>` : "";
  return `${sw} ${esc(c.name)} — ${codes}${accent}`;
}

export function carText(v, tagLabels = [], { maxColors = 12, limit = 3900 } = {}) {
  const colors = v.colors || [];
  const cat = getCategory(v.category)?.name || v.category || "—";
  const lines = [`🚗 <b>${esc(v.name)}</b>`, `📁 ${esc(cat)} · 🎨 цветов: ${colors.length}`];
  if (tagLabels.length) lines.push(`🏷 ${tagLabels.map(esc).join(" · ")}`);
  lines.push(DIV);
  if (colors.length === 0) lines.push("🎨 Цветов пока нет");
  colors.slice(0, maxColors).forEach((c) => lines.push(colorLine(c)));
  if (colors.length > maxColors) lines.push(`…и ещё ${colors.length - maxColors}`);
  const when = v.edited_at || v.created_at;
  if (when) lines.push(DIV, `🕒 ${rel(when)}${v.edited_by ? ` · ${esc(v.edited_by)}` : ""}`);
  return fit(lines, limit);
}

export function carKeyboard(v, site = "") {
  const rows = [];
  if (site.startsWith("https://")) {
    const slug = encodeURIComponent(v.slug);
    rows.push([
      { text: "🌐 На сайте", url: `${site}/vehicle/${slug}` },
      { text: "✏️ В админке", url: `${site}/admin/vehicle-editor?slug=${slug}` },
    ]);
  }
  return navKeyboard(rows);
}

// Фото для sendPhoto: Telegram принимает только https и не любит webp/avif.
export function photoUrl(url, site = "") {
  if (typeof url !== "string" || !url) return "";
  let u = url;
  if (u.startsWith("/")) u = site.startsWith("https://") ? `${site}${u}` : "";
  if (!u.startsWith("https://")) return "";
  const marker = "/image/upload/";
  if (u.includes("res.cloudinary.com") && u.includes(marker)) {
    const i = u.indexOf(marker) + marker.length;
    return `${u.slice(0, i)}f_jpg,q_auto,c_limit,w_1000/${u.slice(i)}`;
  }
  return u;
}
