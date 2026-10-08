#!/usr/bin/env node
// Удаляет файлы, которые заменены или больше не нужны после обновления.
// Запуск из корня проекта: node scripts/apply-update.mjs
// После запуска этот файл можно удалить.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const OLD = [
  "src/context/VehiclesContext.jsx", // → VehiclesContext.js + VehiclesProvider.jsx
  "src/context/TagsContext.jsx",
  "src/context/FavoritesContext.jsx",
  "src/lib/adminIdentity.js", // пустая обёртка
  "scripts/migrate-tags.mjs", // больше не запускается (tags.js ушёл в Supabase)
];

let removed = 0;
for (const rel of OLD) {
  const full = path.join(ROOT, rel);
  if (fs.existsSync(full)) {
    fs.unlinkSync(full);
    console.log("удалён:", rel);
    removed++;
  } else {
    console.log("уже нет:", rel);
  }
}
console.log(`\nГотово, удалено файлов: ${removed}.`);
