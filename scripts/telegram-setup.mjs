#!/usr/bin/env node
// Подключает Telegram-бота к сайту: регистрирует вебхук и список команд.
// Запуск из корня проекта ПОСЛЕ деплоя (и после задания переменных на Vercel):
//   node scripts/telegram-setup.mjs https://твой-сайт.vercel.app
//   node scripts/telegram-setup.mjs --info      — показать состояние вебхука
//   node scripts/telegram-setup.mjs --delete    — отключить вебхук
// Нужен .env с TELEGRAM_BOT_TOKEN и TELEGRAM_WEBHOOK_SECRET
// (тот же секрет, что задан на Vercel).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadDotEnv();

const token = process.env.TELEGRAM_BOT_TOKEN || "";
const secret = process.env.TELEGRAM_WEBHOOK_SECRET || "";
const args = process.argv.slice(2);

if (!token) {
  console.error("Нет TELEGRAM_BOT_TOKEN в .env.");
  process.exit(1);
}

async function call(method, payload = {}) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!json.ok) throw new Error(`${method}: ${json.description || res.status}`);
  return json.result;
}

async function main() {
  if (args.includes("--info")) {
    console.log(JSON.stringify(await call("getWebhookInfo"), null, 2));
    return;
  }
  if (args.includes("--delete")) {
    await call("deleteWebhook", { drop_pending_updates: true });
    console.log("Вебхук отключён.");
    return;
  }

  const site = (args.find((a) => a.startsWith("http")) || process.env.VITE_SITE_URL || "").replace(/\/+$/, "");
  if (!site.startsWith("https://")) {
    console.error("Укажи https-адрес сайта: node scripts/telegram-setup.mjs https://твой-сайт.vercel.app");
    process.exit(1);
  }
  if (!/^[A-Za-z0-9_-]{16,256}$/.test(secret)) {
    console.error(
      "TELEGRAM_WEBHOOK_SECRET должен быть от 16 символов из A-Z a-z 0-9 _ -.\n" +
        "Сгенерировать: node -e \"console.log(require('crypto').randomBytes(24).toString('hex'))\""
    );
    process.exit(1);
  }

  await call("setWebhook", {
    url: `${site}/api/telegram`,
    secret_token: secret,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
  });
  await call("setMyCommands", {
    commands: [
      { command: "menu", description: "Меню с кнопками" },
      { command: "find", description: "Поиск машины" },
      { command: "car", description: "Карточка машины с цветами" },
      { command: "top", description: "Популярное" },
      { command: "recent", description: "Новые машины" },
      { command: "health", description: "Здоровье каталога" },
      { command: "audit", description: "Правки админов" },
      { command: "new", description: "Новые репорты с кнопками" },
      { command: "stats", description: "Сводка по каталогу и репортам" },
    ],
  });
  console.log(`Готово: вебхук ${site}/api/telegram, команды /new /stats /help.`);
  const info = await call("getWebhookInfo");
  if (info.last_error_message) console.log("Последняя ошибка Telegram:", info.last_error_message);
}

main().catch((err) => {
  console.error("Ошибка:", err.message);
  process.exit(1);
});
