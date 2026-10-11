#!/usr/bin/env node
// Объединяет admin-audit / admin-reports / admin-trash в одну serverless-функцию
// api/admin-data.js (лимит Hobby: 12 функций). Было 13, станет 11.
//
// Положи файл в scripts/ и запусти из корня проекта:
//   node scripts/apply-merge-admin-api.mjs --dry-run   — только показать, что будет
//   node scripts/apply-merge-admin-api.mjs             — применить
//
// Безопасно запускать повторно. После успешного запуска файл можно удалить.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry-run");
const API = path.join(ROOT, "api");
const LIB = path.join(API, "_lib");

let failed = 0;
const rel = (p) => path.relative(ROOT, p).replaceAll("\\", "/");
const ok = (msg) => console.log(`✓ ${msg}`);
const same = (msg) => console.log(`= ${msg}`);
const bad = (msg) => {
  console.error(`✗ ${msg}`);
  failed++;
};

function readText(file) {
  const raw = fs.readFileSync(file, "utf8");
  return { text: raw.replace(/\r\n/g, "\n"), crlf: raw.includes("\r\n") };
}

function writeText(file, text, crlf = false) {
  if (DRY) return;
  fs.writeFileSync(file, crlf ? text.replace(/\n/g, "\r\n") : text);
}

// ── 1. перенос обработчиков в api/_lib и правка их импортов ──────────────

const MOVED = ["admin-audit", "admin-reports", "admin-trash"];

for (const name of MOVED) {
  const from = path.join(API, `${name}.js`);
  const to = path.join(LIB, `${name}.js`);

  if (fs.existsSync(from) && fs.existsSync(to)) {
    bad(`${rel(from)} и ${rel(to)} существуют одновременно — разберись вручную`);
    continue;
  }
  if (fs.existsSync(from)) {
    if (!DRY) fs.renameSync(from, to);
    ok(`${rel(from)} → ${rel(to)}`);
  } else if (fs.existsSync(to)) {
    same(`${rel(to)}: уже перенесён`);
  } else {
    bad(`не найден ни ${rel(from)}, ни ${rel(to)}`);
    continue;
  }

  const target = DRY && fs.existsSync(from) ? from : to;
  const { text, crlf } = readText(target);
  const fixed = text
    .replaceAll('"./_lib/auth.js"', '"./auth.js"')
    .replaceAll('"./_lib/db.js"', '"./db.js"');
  if (fixed !== text) {
    writeText(target, fixed, crlf);
    ok(`${rel(to)}: импорты исправлены`);
  } else {
    same(`${rel(to)}: импорты в порядке`);
  }
}

// ── 2. диспетчер api/admin-data.js ───────────────────────────────────────

const DISPATCHER = `import audit from "./_lib/admin-audit.js";
import reports from "./_lib/admin-reports.js";
import trash from "./_lib/admin-trash.js";

// Один serverless-эндпоинт вместо трёх (лимит 12 функций на Hobby).
// Тело запроса: { resource: "audit" | "reports" | "trash", ...параметры }
// Метод и проверку админа делает каждый обработчик сам.
const HANDLERS = { audit, reports, trash };

export default function handler(req, res) {
  const resource = req.body && typeof req.body === "object" ? req.body.resource : null;
  const fn = typeof resource === "string" && Object.hasOwn(HANDLERS, resource) ? HANDLERS[resource] : null;
  if (!fn) {
    res.status(400).json({ error: "Неизвестный ресурс" });
    return;
  }
  return fn(req, res);
}
`;

const dispatcherPath = path.join(API, "admin-data.js");
if (fs.existsSync(dispatcherPath)) {
  same(`${rel(dispatcherPath)}: уже есть`);
} else {
  writeText(dispatcherPath, DISPATCHER);
  ok(`${rel(dispatcherPath)}: создан`);
}

// ── 3. правка клиентских вызовов ─────────────────────────────────────────

const PATCHES = [
  { file: "src/pages/admin/AuditLog.jsx", old: "admin-audit", resource: "audit" },
  { file: "src/pages/admin/ReportsQueue.jsx", old: "admin-reports", resource: "reports" },
  { file: "src/pages/admin/AdminLayout.jsx", old: "admin-reports", resource: "reports" },
  { file: "src/pages/admin/Trash.jsx", old: "admin-trash", resource: "trash" },
];

for (const p of PATCHES) {
  const full = path.join(ROOT, p.file);
  if (!fs.existsSync(full)) {
    bad(`${p.file}: файла нет`);
    continue;
  }
  const { text, crlf } = readText(full);
  const find = `"/api/${p.old}", { `;
  const count = text.split(find).length - 1;
  if (count === 0) {
    if (text.includes("/api/admin-data")) same(`${p.file}: уже применено`);
    else bad(`${p.file}: вызов "/api/${p.old}" не найден`);
    continue;
  }
  const next = text.split(find).join(`"/api/admin-data", { resource: "${p.resource}", `);
  writeText(full, next, crlf);
  ok(`${p.file}: заменено вызовов: ${count}`);
}

// ── 4. проверки ──────────────────────────────────────────────────────────

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else if (/\.(js|jsx|mjs)$/.test(e.name)) out.push(full);
  }
  return out;
}

if (!DRY) {
  const leftovers = [];
  for (const file of [...walk(path.join(ROOT, "src")), ...walk(API)]) {
    readText(file)
      .text.split("\n")
      .forEach((line, i) => {
        if (/\/api\/admin-(audit|reports|trash)\b/.test(line)) leftovers.push(`  ${rel(file)}:${i + 1}: ${line.trim()}`);
      });
  }
  if (leftovers.length) {
    console.log("\nОстались упоминания старых адресов (проверь, нужны ли они):");
    console.log(leftovers.join("\n"));
  }

  const fnCount = fs.readdirSync(API, { withFileTypes: true }).filter((e) => e.isFile() && e.name.endsWith(".js")).length;
  console.log(`\nФункций в api/: ${fnCount} (лимит Hobby — 12)${fnCount > 12 ? " — ЕЩЁ СЛИШКОМ МНОГО" : ""}`);
}

console.log(
  failed
    ? `\nОшибок: ${failed}. Остальное применено.`
    : DRY
    ? "\nЭто был dry-run — ничего не изменено."
    : "\nГотово. Проверь: npm run lint && npm test && npm run build, затем git add -A && git commit && git push."
);
process.exit(failed ? 1 : 0);
