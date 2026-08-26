#!/usr/bin/env node
/**
 * Одноразовый перенос данных машин из src/data/vehicles (рекурсивно, все
 * .js-файлы кроме index.js) в таблицу vehicles в Supabase (см.
 * sql/vehicles-schema.sql — выполни его ПЕРВЫМ).
 * После успешного переноса и проверки сайта src/data/vehicles/*.js (кроме
 * index.js -> vehicles.js) и старый index.js можно удалить — они больше
 * не импортируются.
 *
 * Нужен .env с SUPABASE_URL (или VITE_SUPABASE_URL) и
 * SUPABASE_SERVICE_KEY (service_role key, НЕ anon!) — тот же принцип,
 * что у scripts/migrate-credits.mjs.
 *
 * Запуск: node scripts/migrate-vehicles.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const VEHICLES_DIR = path.join(ROOT, "src/data/vehicles");

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

const SUPABASE_URL = (
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ""
).replace(/\/+$/, "");
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "Не заданы SUPABASE_URL / SUPABASE_SERVICE_KEY. Проверь .env (см. _env.example)."
  );
  process.exit(1);
}

const headers = {
  apikey: SUPABASE_SERVICE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "resolution=merge-duplicates,return=minimal",
};

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else if (entry.name.endsWith(".js") && entry.name !== "index.js") {
      out.push(full);
    }
  }
  return out;
}

async function main() {
  const files = walk(VEHICLES_DIR);
  console.log(`Найдено ${files.length} файлов машин.`);

  const rows = [];
  for (const file of files) {
    const mod = await import(pathToFileURL(file).href);
    const v = mod.default;
    if (!v?.slug) {
      console.warn(`Пропущен (нет default export / slug): ${file}`);
      continue;
    }
    rows.push({
      slug: v.slug,
      category: v.category,
      name: v.name,
      tags: v.tags || [],
      image: v.image || "",
      colors: v.colors || [],
    });
  }

  console.log(`Переношу ${rows.length} машин в Supabase...`);

  const BATCH = 50;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/vehicles`, {
      method: "POST",
      headers,
      body: JSON.stringify(batch),
    });
    if (!res.ok) {
      throw new Error(`Батч ${i}: ${res.status} ${await res.text()}`);
    }
    console.log(`  ...${Math.min(i + BATCH, rows.length)}/${rows.length}`);
  }

  console.log("Готово. Проверь таблицу vehicles в Supabase, потом сайт /category/*.");
}

main().catch((err) => {
  console.error("Ошибка:", err.message);
  process.exit(1);
});
