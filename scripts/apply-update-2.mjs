#!/usr/bin/env node
// Вносит небольшие правки в существующие файлы проекта (маршруты админки,
// уведомления о репортах, корзина, подсказки для телефона и т.д.).
// Запуск из корня проекта ПОСЛЕ распаковки архива: node scripts/apply-update-2.mjs
// Безопасно запускать повторно. После успешного запуска файл можно удалить.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const ENV_BLOCK = `
# ── Уведомления о новых репортах (необязательно) ──────────────────────
# Webhook Discord или Slack: создай его в настройках канала.
REPORT_WEBHOOK_URL=
# Или Telegram: токен бота от @BotFather и id чата (бот должен быть в чате).
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
`;

const TG_BLOCK = `
# ── Telegram-бот: кнопки «Принять / Отклонить», команды, утренняя сводка ──
# Секрет вебхука: от 16 символов A-Z a-z 0-9 _ -  (node -e "console.log(require('crypto').randomBytes(24).toString('hex'))")
TELEGRAM_WEBHOOK_SECRET=
# Кому разрешено нажимать кнопки и слать команды: id пользователей через запятую
# (свой id покажет бот @userinfobot). ОБЯЗАТЕЛЬНО, если чат — группа.
TELEGRAM_ADMIN_IDS=
# Необязательно: id темы форума-группы, если уведомления нужны в отдельной теме.
TELEGRAM_THREAD_ID=
# 1 = присылать в чат (без звука) каждую правку админов: кто, что, где.
TELEGRAM_AUDIT_FEED=
# Секрет для расписания Vercel (утренняя сводка): любая случайная строка от 16 символов.
CRON_SECRET=
`;

const PATCHES = [
  {
    file: "src/App.jsx",
    steps: [
      [
        `import NotFound from "./pages/NotFound";`,
        `import NotFound from "./pages/NotFound";\nimport ScrollTopButton from "./components/ScrollTopButton";`,
      ],
      [
        `const AuditLog = lazy(() => import("./pages/admin/AuditLog"));`,
        `const AuditLog = lazy(() => import("./pages/admin/AuditLog"));\nconst VehicleImport = lazy(() => import("./pages/admin/VehicleImport"));\nconst Trash = lazy(() => import("./pages/admin/Trash"));`,
      ],
      [
        `<Route path="audit" element={<AuditLog />} />`,
        `<Route path="audit" element={<AuditLog />} />\n            <Route path="vehicle-import" element={<VehicleImport />} />\n            <Route path="trash" element={<Trash />} />`,
      ],
      [`<CompareBar />`, `<CompareBar />\n                <ScrollTopButton />`],
    ],
  },
  {
    file: "src/pages/Home.jsx",
    steps: [
      [
        `import ReportButton from "../components/ReportButton";`,
        `import ReportButton from "../components/ReportButton";\nimport PopularBlock from "../components/PopularBlock";`,
      ],
      [`{recent.length > 0 && (`, `<PopularBlock />\n\n      {recent.length > 0 && (`],
    ],
  },
  {
    file: "src/pages/Compare.jsx",
    steps: [
      [
        `import { Link, useSearchParams } from "react-router-dom";`,
        `import { Link, useNavigate, useSearchParams } from "react-router-dom";`,
      ],
      [
        `import CopyHex from "../components/CopyHex";`,
        `import CopyHex from "../components/CopyHex";\nimport ColorSets from "../components/ColorSets";\nimport { useColorFormat } from "../lib/useColorFormat";\nimport { COLOR_FORMATS } from "../lib/colorFormats";`,
      ],
      [`const FORMATS = ["HEX", "RGB", "HSL"];`, `const FORMATS = COLOR_FORMATS;`],
      [
        `const [fmt, setFmt] = useState("HEX");`,
        `const [fmt, setFmt] = useColorFormat();\n  const navigate = useNavigate();`,
      ],
      [`{FORMATS.map((f) => (`, `{FORMATS.map(({ id: f, label }) => (`],
      [`                {f}\n              </button>`, `                {label}\n              </button>`],
      [
        `        </>\n      )}\n    </div>\n  );\n}`,
        `        </>\n      )}\n\n      {!loading && (\n        <ColorSets\n          refs={entries.map((e) => e.ref)}\n          vehicles={vehicles}\n          onLoad={(next) => {\n            replaceAll(next);\n            if (fromLink) navigate("/compare", { replace: true });\n          }}\n        />\n      )}\n    </div>\n  );\n}`,
      ],
    ],
  },
  {
    file: "src/components/ScreenshotPicker.jsx",
    steps: [
      [
        `const supportsEyeDropper = typeof window !== "undefined" && "EyeDropper" in window;`,
        `const supportsEyeDropper = typeof window !== "undefined" && "EyeDropper" in window;\n  const coarse = typeof window !== "undefined" && Boolean(window.matchMedia?.("(pointer: coarse)").matches);`,
      ],
      [
        `Перетащи скриншот сюда или вставь из буфера (Ctrl+V)`,
        `{coarse ? "Выбери скриншот из галереи" : "Перетащи скриншот сюда или вставь из буфера (Ctrl+V)"}`,
      ],
      [
        `"Наведи курсор на нужное место и нажми — цвет усредняется по небольшой области."`,
        `coarse\n                  ? "Коснись нужного места на скриншоте — цвет усредняется по небольшой области."\n                  : "Наведи курсор на нужное место и нажми — цвет усредняется по небольшой области."`,
      ],
    ],
  },
  {
    file: "index.html",
    steps: [
      [
        `<link rel="icon" type="image/png" href="/favicon.png" />`,
        `<link rel="icon" type="image/png" href="/favicon.png" />\n    <link rel="manifest" href="/manifest.webmanifest" />\n    <link rel="apple-touch-icon" href="/icons/icon-192.png" />\n    <meta name="theme-color" content="#0a0c0f" />`,
      ],
    ],
  },
  { file: "_env.example", append: ENV_BLOCK, marker: "REPORT_WEBHOOK_URL" },
  { file: "_env.example", append: TG_BLOCK, marker: "TELEGRAM_WEBHOOK_SECRET" },
];

let failed = 0;
for (const patch of PATCHES) {
  const full = path.join(ROOT, patch.file);
  if (!fs.existsSync(full)) {
    console.error(`✗ ${patch.file}: файла нет`);
    failed++;
    continue;
  }
  const raw = fs.readFileSync(full, "utf8");
  const crlf = raw.includes("\r\n");
  let text = raw.replace(/\r\n/g, "\n");

  if (patch.append !== undefined) {
    if (text.includes(patch.marker)) console.log(`= ${patch.file}: уже применено`);
    else {
      text = text.replace(/\n*$/, "\n") + patch.append;
      fs.writeFileSync(full, crlf ? text.replace(/\n/g, "\r\n") : text);
      console.log(`✓ ${patch.file}`);
    }
    continue;
  }

  let error = "";
  let changed = false;
  for (const [find, replace] of patch.steps) {
    if (text.includes(replace)) continue; // уже применено
    const count = text.split(find).length - 1;
    if (count !== 1) {
      error = `якорь ${count === 0 ? "не найден" : "встречается " + count + " раз"}: ${find.slice(0, 60).replace(/\n/g, "⏎")}`;
      break;
    }
    text = text.replace(find, () => replace);
    changed = true;
  }
  if (error) {
    console.error(`✗ ${patch.file}: ${error} (файл не изменён)`);
    failed++;
  } else if (changed) {
    fs.writeFileSync(full, crlf ? text.replace(/\n/g, "\r\n") : text);
    console.log(`✓ ${patch.file}`);
  } else console.log(`= ${patch.file}: уже применено`);
}

console.log(failed ? `\nОшибок: ${failed}. Остальные файлы обновлены.` : "\nГотово. Проверь npm run lint && npm test && npm run build.");
process.exit(failed ? 1 : 0);
