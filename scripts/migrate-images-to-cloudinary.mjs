#!/usr/bin/env node
/**
 * Переносит все фотографии машин (и категорий), которые сейчас физически
 * лежат в public/images/**, в Cloudinary — с сохранением ТОЙ ЖЕ структуры
 * папок, что и на диске сейчас — и заменяет пути на итоговые secure_url:
 *   - для машин: прямо в таблице `vehicles` в Supabase (поля image и
 *     colors[].image);
 *   - для категорий: в самом файле src/data/categories.js (категории не
 *     живут в базе, поэтому там просто патчится исходник).
 *
 * ВАЖНО: загрузка идёт ПОДПИСАННЫМ запросом (api_key + api_secret +
 * signature), а НЕ через unsigned upload preset, как это сделано в
 * конструкторе (src/constructor/constructor-source.html, Constructor.jsx).
 * Именно поэтому нужен CLOUDINARY_API_SECRET — и именно поэтому этот
 * скрипт запускается только локально, никогда из браузера.
 *
 * Никаких новых npm-пакетов не требуется: fetch/FormData/Blob уже есть
 * в Node 20+ (тот же Node, что нужен для vite в этом проекте), а подпись
 * считается через встроенный node:crypto.
 *
 * ---------------------------------------------------------------------
 * Нужен .env (в корне проекта) со следующими переменными:
 *
 *   SUPABASE_URL              (или VITE_SUPABASE_URL)
 *   SUPABASE_SERVICE_KEY      — service_role key (НЕ anon!)
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 *   CLOUDINARY_FOLDER         — необязательно, по умолчанию "osnova"
 *
 * Ни один из них не должен иметь префикс VITE_ — они не должны попасть
 * в собранный JS сайта (см. пояснения в _env.example).
 * ---------------------------------------------------------------------
 *
 * Запуск (из корня проекта):
 *
 *   node scripts/migrate-images-to-cloudinary.mjs
 *       — реальный перенос: грузит фото, обновляет Supabase и
 *         src/data/categories.js.
 *
 *   node scripts/migrate-images-to-cloudinary.mjs --dry-run
 *       — ничего не грузит и не меняет, только печатает, что было бы
 *         сделано. Всегда прогоняй сначала так.
 *
 *   node scripts/migrate-images-to-cloudinary.mjs --delete-local
 *       — после успешной загрузки каждого файла сразу удаляет его
 *         локальную копию из public/images. Без этого флага локальные
 *         файлы остаются на месте (безопасный вариант по умолчанию —
 *         удали их вручную, когда убедишься, что сайт работает).
 *
 *   node scripts/migrate-images-to-cloudinary.mjs --concurrency=6
 *       — сколько файлов грузить параллельно (по умолчанию 4).
 *
 * Скрипт идемпотентен: если поле image уже начинается с http:// или
 * https:// (т.е. уже перенесено), оно пропускается — можно смело
 * прервать и перезапустить скрипт в любой момент.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");

// ---------------------------------------------------------------------
// .env — тот же простой загрузчик без зависимостей, что уже используется
// в scripts/migrate-vehicles.mjs и scripts/migrate-credits.mjs.
// ---------------------------------------------------------------------
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
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "";
const API_KEY = process.env.CLOUDINARY_API_KEY || "";
const API_SECRET = process.env.CLOUDINARY_API_SECRET || "";
const BASE_FOLDER = (process.env.CLOUDINARY_FOLDER || "osnova").replace(/^\/+|\/+$/g, "");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const DELETE_LOCAL = args.includes("--delete-local");
const concurrencyArg = args.find((a) => a.startsWith("--concurrency="));
const CONCURRENCY = concurrencyArg
  ? Math.max(1, parseInt(concurrencyArg.split("=")[1], 10) || 4)
  : 4;

function assertEnv() {
  const missing = [];
  if (!SUPABASE_URL) missing.push("SUPABASE_URL / VITE_SUPABASE_URL");
  if (!SUPABASE_SERVICE_KEY) missing.push("SUPABASE_SERVICE_KEY");
  if (!CLOUD_NAME) missing.push("CLOUDINARY_CLOUD_NAME");
  if (!API_KEY) missing.push("CLOUDINARY_API_KEY");
  if (!API_SECRET) missing.push("CLOUDINARY_API_SECRET");
  if (missing.length) {
    console.error("Не заданы переменные окружения: " + missing.join(", "));
    console.error("Проверь .env — см. README-CLOUDINARY-MIGRATION.md.");
    process.exit(1);
  }
}
assertEnv();

// ---------------------------------------------------------------------
// Cloudinary — подписанная загрузка напрямую через REST API (без пакета
// cloudinary и без form-data — используем встроенные в Node 20+
// fetch / FormData / Blob).
// ---------------------------------------------------------------------

const MIME_BY_EXT = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

function guessMime(filePath) {
  return MIME_BY_EXT[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

// Подпись Cloudinary: sha1(отсортированные_по_ключу_параметры + api_secret).
// В подпись НЕ входят file, cloud_name, resource_type, api_key, signature.
function signParams(params) {
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return crypto.createHash("sha1").update(sorted + API_SECRET).digest("hex");
}

async function uploadToCloudinary(filePath, { folder, publicId }) {
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = {
    folder,
    public_id: publicId,
    overwrite: "true",
    invalidate: "true",
    timestamp: String(timestamp),
  };
  const signature = signParams(paramsToSign);

  const buffer = fs.readFileSync(filePath);
  const blob = new Blob([buffer], { type: guessMime(filePath) });

  const form = new FormData();
  form.append("file", blob, path.basename(filePath));
  form.append("api_key", API_KEY);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  form.append("folder", folder);
  form.append("public_id", publicId);
  form.append("overwrite", "true");
  form.append("invalidate", "true");

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Cloudinary ${res.status}: ${text.slice(0, 300)}`);
  }

  const json = await res.json();
  return json.secure_url;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Пара повторных попыток на случай временной ошибки/рейт-лимита Cloudinary.
async function uploadWithRetry(filePath, opts, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await uploadToCloudinary(filePath, opts);
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await sleep(800 * (i + 1));
    }
  }
  throw lastErr;
}

// Простой пул конкурентности без внешних зависимостей.
async function runPool(items, worker, concurrency) {
  let cursor = 0;
  async function next() {
    while (cursor < items.length) {
      const i = cursor++;
      await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, next));
}

// ---------------------------------------------------------------------
// Supabase REST (service_role — полный доступ в обход RLS)
// ---------------------------------------------------------------------

async function supabaseAdmin(pathSuffix, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathSuffix}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase ${res.status}: ${text.slice(0, 300)}`);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function isLocalImagePath(value) {
  return typeof value === "string" && value.startsWith("/images/");
}

function localFileFor(webPath) {
  // "/images/vehicles/legkovoy/x/main.jpg" -> public/images/vehicles/legkovoy/x/main.jpg
  return path.join(PUBLIC_DIR, webPath.replace(/^\/+/, ""));
}

// ---------------------------------------------------------------------
// Задачи на загрузку для машин. Каждая задача помнит, куда именно писать
// результат назад (image самой машины или colors[i].image), чтобы после
// параллельной загрузки собрать все изменения и отправить один PATCH на
// машину, а не по одному PATCH на каждую картинку.
// ---------------------------------------------------------------------

function buildVehicleTasks(vehicles) {
  const tasks = [];
  for (const vehicle of vehicles) {
    if (isLocalImagePath(vehicle.image)) {
      tasks.push({
        kind: "vehicle-main",
        slug: vehicle.slug,
        localPath: vehicle.image,
        folder: `${BASE_FOLDER}/vehicles/${vehicle.category}/${vehicle.slug}`,
        publicId: path.basename(vehicle.image, path.extname(vehicle.image)),
      });
    }
    (vehicle.colors || []).forEach((color, colorIndex) => {
      if (isLocalImagePath(color.image)) {
        tasks.push({
          kind: "vehicle-color",
          slug: vehicle.slug,
          colorIndex,
          localPath: color.image,
          folder: `${BASE_FOLDER}/vehicles/${vehicle.category}/${vehicle.slug}`,
          publicId: path.basename(color.image, path.extname(color.image)),
        });
      }
    });
  }
  return tasks;
}

// ---------------------------------------------------------------------
// src/data/categories.js — это статический файл, не таблица в базе,
// поэтому для него просто патчится сам исходник (по найденным строкам
// image: "..."), а не делается запрос к Supabase.
// ---------------------------------------------------------------------

async function migrateCategoriesFile(stats) {
  const filePath = path.join(ROOT, "src/data/categories.js");
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, "utf8");
  const regex = /image:\s*"([^"]+)"/g;
  const localPaths = new Map(); // localPath -> newUrl | null
  let match;
  while ((match = regex.exec(content))) {
    const value = match[1];
    if (isLocalImagePath(value)) localPaths.set(value, null);
  }

  for (const localPath of localPaths.keys()) {
    const fileOnDisk = localFileFor(localPath);
    stats.total++;

    if (!fs.existsSync(fileOnDisk)) {
      stats.skippedMissing++;
      console.warn(`  [categories] файла нет на диске, пропускаю: ${localPath}`);
      continue;
    }

    const publicId = path.basename(localPath, path.extname(localPath));
    const folder = `${BASE_FOLDER}/categories`;

    if (DRY_RUN) {
      console.log(`  [dry-run][categories] ${localPath} -> ${folder}/${publicId}`);
      continue;
    }

    try {
      const url = await uploadWithRetry(fileOnDisk, { folder, publicId });
      localPaths.set(localPath, url);
      stats.uploaded++;
      console.log(`  [categories] ${localPath} -> ${url}`);
      if (DELETE_LOCAL) fs.unlinkSync(fileOnDisk);
    } catch (err) {
      stats.failed++;
      console.error(`  [categories] ошибка загрузки ${localPath}: ${err.message}`);
    }
  }

  if (DRY_RUN) return;

  let changed = false;
  for (const [localPath, url] of localPaths) {
    if (!url) continue;
    const before = content;
    content = content.split(`"${localPath}"`).join(`"${url}"`);
    if (content !== before) changed = true;
  }
  if (changed) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log("  [categories] src/data/categories.js обновлён");
  }
}

// ---------------------------------------------------------------------
// main
// ---------------------------------------------------------------------

async function main() {
  console.log(
    `Cloudinary: cloud=${CLOUD_NAME}, folder=${BASE_FOLDER}${DRY_RUN ? " (dry-run, без изменений)" : ""}`
  );

  console.log("Загружаю список машин из Supabase...");
  const vehicles = await supabaseAdmin("vehicles?select=*");
  console.log(`Найдено машин: ${vehicles.length}`);

  const tasks = buildVehicleTasks(vehicles);
  console.log(`Найдено картинок машин для переноса: ${tasks.length}`);

  const stats = { total: tasks.length, uploaded: 0, failed: 0, skippedMissing: 0 };

  // slug -> { image?: url, colorUpdates: Map<colorIndex, url> }
  const updatesBySlug = new Map();

  await runPool(
    tasks,
    async (task) => {
      const fileOnDisk = localFileFor(task.localPath);

      if (!fs.existsSync(fileOnDisk)) {
        stats.skippedMissing++;
        console.warn(`  [пропуск] файла нет на диске: ${task.localPath} (машина ${task.slug})`);
        return;
      }

      if (DRY_RUN) {
        console.log(`  [dry-run] ${task.slug}: ${task.localPath} -> ${task.folder}/${task.publicId}`);
        return;
      }

      try {
        const url = await uploadWithRetry(fileOnDisk, { folder: task.folder, publicId: task.publicId });
        stats.uploaded++;
        console.log(`  ${task.slug}: ${task.localPath} -> ${url}`);

        if (!updatesBySlug.has(task.slug)) {
          updatesBySlug.set(task.slug, { image: undefined, colorUpdates: new Map() });
        }
        const bucket = updatesBySlug.get(task.slug);
        if (task.kind === "vehicle-main") {
          bucket.image = url;
        } else {
          bucket.colorUpdates.set(task.colorIndex, url);
        }

        if (DELETE_LOCAL) fs.unlinkSync(fileOnDisk);
      } catch (err) {
        stats.failed++;
        console.error(`  ошибка загрузки ${task.localPath} (машина ${task.slug}): ${err.message}`);
      }
    },
    CONCURRENCY
  );

  if (!DRY_RUN && updatesBySlug.size > 0) {
    console.log(`Обновляю ${updatesBySlug.size} записей в таблице vehicles...`);
    for (const vehicle of vehicles) {
      const bucket = updatesBySlug.get(vehicle.slug);
      if (!bucket) continue;

      const nextImage = bucket.image ?? vehicle.image;
      const nextColors = (vehicle.colors || []).map((color, i) =>
        bucket.colorUpdates.has(i) ? { ...color, image: bucket.colorUpdates.get(i) } : color
      );

      try {
        await supabaseAdmin(`vehicles?slug=eq.${encodeURIComponent(vehicle.slug)}`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ image: nextImage, colors: nextColors }),
        });
      } catch (err) {
        console.error(`  ошибка обновления записи ${vehicle.slug}: ${err.message}`);
      }
    }
  }

  console.log("\nКатегории (src/data/categories.js)...");
  await migrateCategoriesFile(stats);

  console.log("\nГотово.");
  console.log(`  Всего найдено картинок:        ${stats.total}`);
  console.log(`  Загружено в Cloudinary:        ${stats.uploaded}`);
  console.log(`  Пропущено (файла нет на диске): ${stats.skippedMissing}`);
  console.log(`  Ошибок:                        ${stats.failed}`);

  if (DRY_RUN) {
    console.log(
      "\nЭто был dry-run — ничего не загружено и не изменено. Проверь список выше и запусти без --dry-run."
    );
  } else if (!DELETE_LOCAL) {
    console.log(
      "\nЛокальные файлы НЕ удалены (это безопасно по умолчанию). Когда убедишься, что сайт " +
        "показывает картинки с Cloudinary — удали public/images/vehicles вручную, либо перезапусти " +
        "с флагом --delete-local в следующий раз."
    );
  }
}

main().catch((err) => {
  console.error("Критическая ошибка:", err);
  process.exit(1);
});
