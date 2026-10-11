#!/usr/bin/env node
/**
 * Удаляет старую папку src/data/vehicles/ (по одному .js-файлу на машину) и
 * scripts/migrate-vehicles.mjs — после того как все машины уже лежат в
 * Supabase. Каталог теперь читается из таблицы vehicles, а рядом лежит
 * файл src/data/vehicles.js: пока старая папка существует, импорт
 * "../data/vehicles" двусмыслен (файл или папка), поэтому её лучше убрать.
 *
 * Перед удалением скрипт проверяет, что
 *   1) каждая машина из старых файлов есть в таблице vehicles в Supabase;
 *   2) src/data/vehicles.js на месте;
 *   3) в src нигде не импортируются файлы из старой папки.
 * Если что-то не сходится — ничего не удаляет и показывает, что именно.
 *
 * Нужен .env с SUPABASE_URL (или VITE_SUPABASE_URL) и ключом:
 * SUPABASE_SERVICE_KEY или VITE_SUPABASE_ANON_KEY (хватит чтения).
 *
 * Запуск (из корня проекта, сначала закоммить изменения в git):
 *   node scripts/cleanup-legacy-vehicles.mjs --dry-run   — только проверка
 *   node scripts/cleanup-legacy-vehicles.mjs             — проверка и удаление
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LEGACY_DIR = path.join(ROOT, "src/data/vehicles");
const DRY_RUN = process.argv.includes("--dry-run");

function loadDotEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadDotEnv();

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
const KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

function fail(lines) {
  console.error(["", ...lines, "", "Ничего не удалено."].join("\n"));
  process.exit(1);
}

function walk(dir, filter) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, filter));
    else if (filter(entry.name)) out.push(full);
  }
  return out;
}

async function main() {
  if (!fs.existsSync(LEGACY_DIR)) {
    console.log("Папки src/data/vehicles уже нет — делать нечего.");
    return;
  }
  if (!fs.existsSync(path.join(ROOT, "src/data/vehicles.js"))) {
    fail(["Нет файла src/data/vehicles.js — сайт без него не заработает."]);
  }
  if (!SUPABASE_URL || !KEY) {
    fail(["Не заданы SUPABASE_URL и ключ (SUPABASE_SERVICE_KEY или VITE_SUPABASE_ANON_KEY) в .env."]);
  }

  // 3) нет ли импортов из старой папки (не считая "../data/vehicles" без слэша)
  const legacyImport = /from\s+["'][^"']*data\/vehicles\/[^"']+["']/;
  const offenders = walk(path.join(ROOT, "src"), (n) => /\.(js|jsx)$/.test(n))
    .filter((f) => !f.startsWith(LEGACY_DIR + path.sep))
    .filter((f) => legacyImport.test(fs.readFileSync(f, "utf8")));
  if (offenders.length > 0) {
    fail(["Эти файлы всё ещё импортируют что-то из старой папки:", ...offenders.map((f) => "  " + path.relative(ROOT, f))]);
  }

  // 1) все ли машины уже в Supabase
  const files = walk(LEGACY_DIR, (n) => n.endsWith(".js") && n !== "index.js");
  const legacySlugs = [];
  const unreadable = [];
  for (const file of files) {
    try {
      const mod = await import(pathToFileURL(file).href);
      if (mod.default?.slug) legacySlugs.push(mod.default.slug);
      else unreadable.push(`${path.relative(ROOT, file)} (нет default export / slug)`);
    } catch (err) {
      unreadable.push(`${path.relative(ROOT, file)} (${err.message})`);
    }
  }
  if (unreadable.length > 0) {
    fail(["Не удалось прочитать эти файлы машин — не могу убедиться, что они перенесены:", ...unreadable.map((s) => "  " + s)]);
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/vehicles?select=slug&limit=5000`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) fail([`Supabase ответил ${res.status}: ${(await res.text()).slice(0, 200)}`]);
  const inDb = new Set((await res.json()).map((r) => r.slug));
  const missing = legacySlugs.filter((s) => !inDb.has(s));
  if (missing.length > 0) {
    fail([
      `${missing.length} из ${legacySlugs.length} машин из старых файлов НЕ найдены в Supabase:`,
      ...missing.map((s) => "  " + s),
      "Сначала перенеси их: node scripts/migrate-vehicles.mjs",
    ]);
  }

  console.log(`Проверено: все ${legacySlugs.length} машин из старых файлов есть в Supabase.`);

  const targets = [LEGACY_DIR, path.join(ROOT, "scripts/migrate-vehicles.mjs")].filter((p) => fs.existsSync(p));
  for (const target of targets) {
    const rel = path.relative(ROOT, target);
    if (DRY_RUN) {
      console.log(`[dry-run] удалил бы: ${rel}`);
    } else {
      fs.rmSync(target, { recursive: true, force: true });
      console.log(`удалён: ${rel}`);
    }
  }
  console.log(DRY_RUN ? "\nЭто была проверка — ничего не удалено." : "\nГотово. Проверь `npm run build` и сайт.");
}

main().catch((err) => {
  console.error("Ошибка:", err.message);
  process.exit(1);
});
