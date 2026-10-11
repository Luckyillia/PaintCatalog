import test from "node:test";
import assert from "node:assert/strict";
import { buildReportText, notifyReport } from "../api/_lib/notify.js";

const colorRow = { kind: "color_error", vehicle_slug: "bmw", color_id: "white", message: "Hex не тот", contact: "vk" };
const newRow = { kind: "new_vehicle", message: "Предложение машины: ЗАЗ", contact: null, payload: { name: "ЗАЗ", category: "legkovoy", colors: null } };

test("текст уведомления", () => {
  const t = buildReportText(colorRow, "https://x.ru");
  assert.match(t, /Ошибка в цвете/);
  assert.match(t, /bmw \/ white/);
  assert.match(t, /Контакт: vk/);
  assert.match(t, /https:\/\/x\.ru\/admin\/reports/);
  assert.match(buildReportText(newRow), /Название: ЗАЗ/);
  assert.ok(!buildReportText(newRow).includes("Админка"));
});

test("notifyReport: без настроек ничего не отправляет, с настройками — webhook и Telegram", async () => {
  const calls = [];
  const fakeFetch = async (url, init) => { calls.push({ url, body: JSON.parse(init.body) }); return { ok: true, status: 200, json: async () => ({ ok: true }) }; };
  assert.deepEqual(await notifyReport(colorRow, "", {}, fakeFetch), []);
  const res = await notifyReport(colorRow, "https://x.ru", { REPORT_WEBHOOK_URL: "https://hook", TELEGRAM_BOT_TOKEN: "T", TELEGRAM_CHAT_ID: "42" }, fakeFetch);
  assert.deepEqual(res.map((r) => r.ok), [true, true]);
  assert.equal(calls[0].url, "https://hook");
  assert.deepEqual(calls[0].body.allowed_mentions, { parse: [] });
  assert.equal(calls[1].url, "https://api.telegram.org/botT/sendMessage");
  assert.equal(calls[1].body.chat_id, "42");
  assert.equal(calls[1].body.parse_mode, "HTML");
  assert.equal(calls[1].body.reply_markup, undefined); // у репорта без id кнопок нет
});

test("сбой отправки не бросает исключение", async () => {
  const boom = async () => { throw new Error("сеть"); };
  const res = await notifyReport(colorRow, "", { REPORT_WEBHOOK_URL: "https://hook", TELEGRAM_BOT_TOKEN: "T", TELEGRAM_CHAT_ID: "1" }, boom);
  assert.deepEqual(res, [{ name: "webhook", ok: false }, { name: "telegram", ok: false }]);
});

test("Telegram получает кнопки, когда у репорта есть id", async () => {
  const calls = [];
  const fake = async (url, init) => { calls.push(JSON.parse(init.body)); return { ok: true, status: 200, json: async () => ({ ok: true }) }; };
  await notifyReport({ ...colorRow, id: 5, status: "new" }, "https://x.ru", { TELEGRAM_BOT_TOKEN: "T", TELEGRAM_CHAT_ID: "1" }, fake);
  assert.deepEqual(calls[0].reply_markup.inline_keyboard[0].map((b) => b.callback_data), ["r:a:5", "r:r:5"]);
});
