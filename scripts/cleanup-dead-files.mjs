#!/usr/bin/env node
// Одноразовая уборка мёртвых файлов, которые больше нигде не
// импортируются. Запуск из корня проекта:
//
//   node scripts/cleanup-dead-files.mjs
//
// После запуска этот файл можно удалить.
//
// НЕ трогает src/data/vehicles/ (папку с файлами отдельных машин) и
// scripts/migrate-vehicles.mjs — они нужны, пока ты не убедишься, что
// все машины уже перенесены в Supabase.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const DEAD = [
  "scripts/pull-vehicles.mjs",
  "src/components/CarSilhouette.jsx",
  "src/components/IngameShotPlaceholder.jsx",
  "src/assets/react.svg",
  "src/assets/vite.svg",
  "public/images/categories/gruzovoy.jpg.placeholder",
  "public/images/categories/legkovoy.jpg.placeholder",
  "public/images/categories/moto.jpg.placeholder",
  "public/images/categories/obshestvenniy.jpg.placeholder",
  "public/images/categories/sobytiya.jpg.placeholder",
];

let removed = 0;
for (const rel of DEAD) {
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
