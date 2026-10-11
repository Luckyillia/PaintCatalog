#!/usr/bin/env node
// Дописывает новые команды бота в scripts/telegram-setup.mjs и TELEGRAM.md.
// Запуск из корня проекта ПОСЛЕ распаковки архива:
//   node scripts/apply-telegram-menu.mjs
// Безопасно запускать повторно. После успешного запуска файл можно удалить.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const COMMANDS = `commands: [
      { command: "menu", description: "Меню с кнопками" },
      { command: "find", description: "Поиск машины" },
      { command: "car", description: "Карточка машины с цветами" },
      { command: "top", description: "Популярное" },
      { command: "recent", description: "Новые машины" },
      { command: "health", description: "Здоровье каталога" },
      { command: "audit", description: "Правки админов" },
      { command: "new", description: "Новые репорты с кнопками" },
      { command: "stats", description: "Сводка по каталогу и репортам" },
    ],`;

const DOC_LINE =
  "- Команды: `/menu` (меню с кнопками), `/find` (поиск машины, в личном чате можно просто писать название), " +
  "`/car` (карточка с цветами и фото), `/top` (популярное), `/recent` (новые машины), `/health` (здоровье каталога), " +
  "`/audit` (правки админов), `/new` (5 свежих репортов с кнопками), `/stats` (сводка), `/help`.";

const PATCHES = [
  {
    file: "scripts/telegram-setup.mjs",
    done: (t) => t.includes('command: "menu"'),
    apply: (t) => {
      const re = /commands:\s*\[[\s\S]*?\],(?=\s*\}\);)/;
      return re.test(t) ? t.replace(re, () => COMMANDS) : null;
    },
    hint: "Затем: node scripts/telegram-setup.mjs https://твой-сайт.vercel.app (обновит список команд в Telegram).",
  },
  {
    file: "TELEGRAM.md",
    done: (t) => t.includes("`/find`"),
    apply: (t) => {
      const re = /^- Команды:.*$/m;
      return re.test(t) ? t.replace(re, () => DOC_LINE) : null;
    },
  },
];

let failed = 0;
for (const p of PATCHES) {
  const full = path.join(ROOT, p.file);
  if (!fs.existsSync(full)) {
    console.error(`✗ ${p.file}: файла нет`);
    failed++;
    continue;
  }
  const raw = fs.readFileSync(full, "utf8");
  const crlf = raw.includes("\r\n");
  const text = raw.replace(/\r\n/g, "\n");
  if (p.done(text)) {
    console.log(`= ${p.file}: уже применено`);
    continue;
  }
  const next = p.apply(text);
  if (next === null) {
    console.error(`✗ ${p.file}: не нашёл место для правки (файл не изменён)`);
    failed++;
    continue;
  }
  fs.writeFileSync(full, crlf ? next.replace(/\n/g, "\r\n") : next);
  console.log(`✓ ${p.file}`);
  if (p.hint) console.log(`  ${p.hint}`);
}

console.log(failed ? `\nОшибок: ${failed}.` : "\nГотово. Проверь: npm run lint && npm test && npm run build.");
process.exit(failed ? 1 : 0);
