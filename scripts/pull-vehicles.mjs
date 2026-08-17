#!/usr/bin/env node
/**
 * Читает "pending" машины из Supabase (те, что добавили через
 * онлайн-конструктор), скачивает их фото из Cloudinary в
 * public/images/vehicles/..., создаёт src/data/vehicles/<category>/<slug>.js
 * (уже с тегами внутри файла) и помечает запись как synced.
 *
 * В конце останется только добавить import + строку в массив
 * внутри src/data/vehicles/index.js — сам скрипт эти две строки
 * печатает в консоль.
 *
 * Запуск:
 *   node scripts/pull-vehicles.mjs
 *
 * Нужен .env (или переменные окружения) с:
 *   SUPABASE_URL=https://xxxx.supabase.co
 *   SUPABASE_SERVICE_KEY=eyJ...   (service_role key — НЕ anon key, храни в секрете)
 */

import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// --- .env loader (без зависимостей) ---------------------------------
function loadDotEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fssync.existsSync(envPath)) return;
  const content = fssync.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
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

// SUPABASE_URL не секретный, поэтому его можно не дублировать в .env —
// если отдельно не задан, берём тот же VITE_SUPABASE_URL, что видит
// браузерный конструктор. А вот SUPABASE_SERVICE_KEY — секретный,
// НИКОГДА не давай ему префикс VITE_ (иначе он попадёт в браузер).
const SUPABASE_URL = (
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ""
).replace(/\/+$/, "");
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "Не заданы SUPABASE_URL / SUPABASE_SERVICE_KEY. Создай .env в корне проекта (см. .env.example)."
  );
  process.exit(1);
}

const supabaseHeaders = {
  apikey: SUPABASE_SERVICE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
  "Content-Type": "application/json",
};

// --- helpers ----------------------------------------------------------

function escapeJsString(str) {
  return String(str).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

const TRANSLIT_MAP = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
  у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "",
  э: "e", ю: "yu", я: "ya",
};
function transliterateStr(str) {
  return (str || "")
    .toLowerCase()
    .split("")
    .map((c) => (TRANSLIT_MAP[c] !== undefined ? TRANSLIT_MAP[c] : c))
    .join("");
}
function toCamelCase(slug) {
  const parts = transliterateStr(slug)
    .replace(/[^a-z0-9-]+/g, "-")
    .split("-")
    .filter(Boolean);
  if (parts.length === 0) return "vehicle";
  let out = parts[0];
  for (let i = 1; i < parts.length; i++) {
    out += parts[i].charAt(0).toUpperCase() + parts[i].slice(1);
  }
  if (/^[0-9]/.test(out)) out = "_" + out;
  return out;
}

function imagePathFor(category, slug, fileName) {
  return `/images/vehicles/${category}/${slug}/${fileName}.jpg`;
}

async function downloadImage(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Не удалось скачать ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  await fs.writeFile(destPath, buf);
}

function generateVehicleFile(vehicle) {
  const lines = [];
  lines.push("export default {");
  lines.push(`  slug: "${escapeJsString(vehicle.slug)}",`);
  lines.push(`  category: "${escapeJsString(vehicle.category)}",`);
  lines.push(`  name: "${escapeJsString(vehicle.name)}",`);
  const tagsStr = (vehicle.tagIds || []).map((t) => `"${escapeJsString(t)}"`).join(", ");
  lines.push(`  tags: [${tagsStr}],`);
  lines.push(`  image: "${escapeJsString(vehicle.mainImagePath || "")}",`);
  lines.push("  colors: [");
  for (const c of vehicle.colors) {
    const idStr = `id: "${escapeJsString(c.id)}"`;
    const nameStr = `name: "${escapeJsString(c.name)}"`;
    const hexStr = c.twoTone
      ? `hexes: ["${escapeJsString(c.hex1 || "#000000")}", "${escapeJsString(c.hex2 || "#000000")}"]`
      : `hex: "${escapeJsString(c.hex1 || "#000000")}"`;
    const accentStr = c.hasAccent && c.accentHex
      ? `, accentHex: "${escapeJsString(c.accentHex)}"`
      : "";
    const imageStr = `image: "${escapeJsString(c.imagePath || "")}"`;
    lines.push(`    { ${idStr}, ${nameStr}, ${hexStr}${accentStr}, ${imageStr} },`);
  }
  lines.push("  ],");
  lines.push("};");
  lines.push("");
  return lines.join("\n");
}

async function markSynced(id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/pending_vehicles?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...supabaseHeaders, Prefer: "return=minimal" },
    body: JSON.stringify({ status: "synced" }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.warn(`  ! Не удалось пометить запись ${id} как synced: ${res.status} ${text}`);
  }
}

// --- main ---------------------------------------------------------------

async function main() {
  console.log("Проверяю новые машины в Supabase...");
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/pending_vehicles?status=eq.pending&select=*&order=created_at.asc`,
    { headers: supabaseHeaders }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase: ${res.status} ${text}`);
  }
  const rows = await res.json();

  if (rows.length === 0) {
    console.log("Новых машин нет.");
    return;
  }

  console.log(`Найдено машин: ${rows.length}`);
  const indexSnippets = [];

  for (const row of rows) {
    const v = row.data;
    console.log(`\n→ ${v.name} (${v.slug}, ${v.category})`);

    const imgDir = path.join(ROOT, "public", "images", "vehicles", v.category, v.slug);

    let mainImagePath = "";
    if (v.mainImageUrl) {
      mainImagePath = imagePathFor(v.category, v.slug, "main");
      console.log("  скачиваю обложку...");
      await downloadImage(v.mainImageUrl, path.join(ROOT, "public", imagePathFor(v.category, v.slug, "main").replace(/^\//, "")));
    }

    const colors = [];
    for (const c of v.colors || []) {
      let imagePath = "";
      if (c.imageUrl) {
        imagePath = imagePathFor(v.category, v.slug, c.id);
        console.log(`  скачиваю фото цвета "${c.name || c.id}"...`);
        await downloadImage(c.imageUrl, path.join(ROOT, "public", imagePath.replace(/^\//, "")));
      }
      colors.push({ ...c, imagePath });
    }

    const vehicleFileContent = generateVehicleFile({ ...v, mainImagePath, colors });
    const dataFilePath = path.join(ROOT, "src", "data", "vehicles", v.category, `${v.slug}.js`);
    await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
    await fs.writeFile(dataFilePath, vehicleFileContent, "utf8");
    console.log(`  записан: src/data/vehicles/${v.category}/${v.slug}.js`);

    await markSynced(row.id);

    const camel = toCamelCase(v.slug);
    indexSnippets.push({
      slug: v.slug,
      category: v.category,
      importLine: `import ${camel} from "./${v.category}/${v.slug}";`,
      pushName: camel,
    });
  }

  console.log("\n\n=== Готово. Добавь в src/data/vehicles/index.js: ===\n");
  for (const s of indexSnippets) {
    console.log(s.importLine);
  }
  console.log("\n...и в массив vehicles (внутри квадратных скобок), через запятую:\n");
  for (const s of indexSnippets) {
    console.log(`  ${s.pushName},`);
  }
  console.log("\nПосле сохранения — npm run dev, машины появятся на сайте.");
}

main().catch((err) => {
  console.error("\nОшибка:", err.message);
  process.exit(1);
});
