#!/usr/bin/env node
/**
 * Одноразовый перенос текущих данных из старого src/data/credits.js в
 * таблицы credit_groups / credit_entries в Supabase. Запусти один раз
 * ПОСЛЕ выполнения SQL из инструкции (создание таблиц + RLS), затем этот
 * файл можно удалить.
 *
 * Нужен .env с SUPABASE_URL (или VITE_SUPABASE_URL) и
 * SUPABASE_SERVICE_KEY (service_role key, НЕ anon!).
 *
 * Запуск: node scripts/migrate-credits.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

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
  Prefer: "return=minimal",
};

// --- данные, скопированные из старого src/data/credits.js -------------

const groups = [
  { id: "founders", title: "Организация проекта", sort_order: 0 },
  { id: "vehicles", title: "Предоставили машины для подбора цветов", sort_order: 1 },
  { id: "media", title: "Скриншоты и фотоматериалы", sort_order: 2 },
  { id: "dev", title: "Разработка сайта", sort_order: 3 },
  { id: "thanks", title: "Отдельная благодарность", sort_order: 4 },
];

const entries = [
  {
    group_id: "founders",
    sort_order: 0,
    name: "Aristarch_Sokirovskiy",
    role: "Идея и руководство",
    note: "",
    avatar:
      "https://sun9-45.vkuserphoto.ru/s/v1/ig2/eFW5IMcmC5TsTHw0q9-341esnohgM9A_yQGNhTXxAefP0Npye5GQ6PqsUIiuQssSsbob9IaL1i7hPA375Srz_yGv.jpg?quality=95&as=32x18,48x27,72x40,108x61,160x90,240x135,360x202,480x270,540x304,640x360,720x405,1080x607,1280x720,1440x810,1830x1029&from=bu&u=OowcOTkpY5AzLnQbVX0-lbWqH7rgJfJTLvlpGd5Az_4&cs=1830x0",
    link: "https://vk.ru/kievskiy_hamann",
    provider_id: null,
    vehicle_slugs: null,
  },
  {
    group_id: "vehicles",
    sort_order: 0,
    name: "Bentley Production | MTA Province #6",
    role: "Владелец гаража",
    note: null,
    avatar:
      "https://sun9-80.vkuserphoto.ru/s/v1/ig2/VtpYhk9a2Kyq4llK-hT2MxS5LVH7Byf70SwKWqqB94X7ZGERf8pJys2fqUbW-ctzDjinBz_BOsUp8p4UjraEMj1j.jpg?quality=95&as=32x18,48x27,72x40,108x61,160x90,240x135,360x202,480x270,540x304,640x360,720x405,1080x607,1280x720,1440x810,1920x1080&from=bu&u=1fM_6JblSbChlxv1eBT8diR4WqWcTUIRJdPa3nLxF3Y&cs=1920x0",
    link: "https://vk.ru/bentley.prod",
    provider_id: "bentley-production",
    vehicle_slugs: ["porsche-911-993", "honda-nsx", "ferrari-348-gtb"],
  },
  {
    group_id: "vehicles",
    sort_order: 1,
    name: "Forward Auto Rent | Mta Province #6",
    role: "Владелец гаража",
    note: null,
    avatar:
      "https://sun9-10.vkuserphoto.ru/s/v1/ig2/L2kvApiOK3Mk0OErnSDzDS4A9F_Tui22KEYKqH2mXJA97542uov_FPA6FtTQWpCV1Q5Csj0UQB4apgf-PGeMWpWI.jpg?quality=95&as=32x32,48x48,72x72,108x108,160x160,240x240,360x360,480x480,500x500&from=bu&u=ueqmHnc9p73HX2jisUlnUmCHWwxKlixIWidigR3nbmI&cs=500x0",
    link: "https://vk.ru/forwardautorent",
    provider_id: "forward-auto-rent",
    vehicle_slugs: [
      "volkswagen-jetta",
      "jeep-grand-cherokee-zj",
      "bmw-m5-f90",
      "cadillac-escalade",
      "audi-rs6-c7",
      "nissan-200sx",
      "nissan-400z",
      "mercedes-c200-w206",
    ],
  },
  {
    group_id: "vehicles",
    sort_order: 2,
    name: "Astvatsatur_Aesthetic",
    role: "Владелец гаража",
    note: null,
    avatar: null,
    link: null,
    provider_id: "astvatsatur-aesthetic",
    vehicle_slugs: [
      "chevrolet-tahoe-ltz",
      "audi-q7-2013",
      "lexus-lfa",
      "subaru-forester-sg-9",
    ],
  },
  {
    group_id: "media",
    sort_order: 0,
    name: "Bentley Production | MTA Province #6",
    role: "Съёмка в игре",
    note: "",
    avatar:
      "https://sun9-80.vkuserphoto.ru/s/v1/ig2/VtpYhk9a2Kyq4llK-hT2MxS5LVH7Byf70SwKWqqB94X7ZGERf8pJys2fqUbW-ctzDjinBz_BOsUp8p4UjraEMj1j.jpg?quality=95&as=32x18,48x27,72x40,108x61,160x90,240x135,360x202,480x270,540x304,640x360,720x405,1080x607,1280x720,1440x810,1920x1080&from=bu&u=1fM_6JblSbChlxv1eBT8diR4WqWcTUIRJdPa3nLxF3Y&cs=1920x0",
    link: "https://vk.ru/bentley.prod",
    provider_id: null,
    vehicle_slugs: null,
  },
  {
    group_id: "dev",
    sort_order: 0,
    name: "Polter_Sokirovskiy",
    role: "Dev / Разработчик",
    note: "",
    avatar:
      "https://sun9-81.vkuserphoto.ru/impg/DW4IDqvukChyc-WPXmzIot46En40R00idiUAXw/l5w5aIHioYc.jpg?quality=96&as=32x32,48x48,72x72,108x108,160x160,240x240,360x360&sign=10ad7d7953daabb7b0e707fdfb7ebefd&u=I6EtahnrCRLlyd0MhT2raQt6ydhuyxX4s72EHGuUSoM&cs=200x200",
    link: "https://vk.ru/id523507300",
    provider_id: null,
    vehicle_slugs: null,
  },
  {
    group_id: "dev",
    sort_order: 1,
    name: "Claude",
    role: "AI-ассистент",
    note: "Компоненты, стена почёта, доводка UI",
    avatar: null,
    link: null,
    provider_id: null,
    vehicle_slugs: null,
  },
];

async function main() {
  console.log("Переношу блоки...");
  let res = await fetch(`${SUPABASE_URL}/rest/v1/credit_groups`, {
    method: "POST",
    headers: {
      ...headers,
      Prefer: "resolution=ignore-duplicates,return=minimal",
    },
    body: JSON.stringify(groups),
  });
  if (!res.ok) {
    throw new Error(`Группы: ${res.status} ${await res.text()}`);
  }

  console.log("Переношу записи...");
  res = await fetch(`${SUPABASE_URL}/rest/v1/credit_entries`, {
    method: "POST",
    headers,
    body: JSON.stringify(entries),
  });
  if (!res.ok) {
    throw new Error(`Записи: ${res.status} ${await res.text()}`);
  }

  console.log("Готово. Проверь /credits на сайте.");
}

main().catch((err) => {
  console.error("Ошибка:", err.message);
  process.exit(1);
});