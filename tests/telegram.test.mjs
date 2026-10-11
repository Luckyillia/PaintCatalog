import test from "node:test";
import assert from "node:assert/strict";
import {
  escapeHtml, buildReportHtml, reportKeyboard, parseCallback, authorize, parseAdminIds, safeEqual, tgCall, sendToChat, siteUrl,
} from "../api/_lib/telegram.js";
import { notifyAudit } from "../api/_lib/notify.js";

const row = { id: 7, kind: "color_error", vehicle_slug: "bmw-m5", color_id: "white", message: "<b>Hex</b> & не тот", contact: "vk", status: "new" };

test("HTML экранируется", () => {
  assert.equal(escapeHtml("<a>&"), "&lt;a&gt;&amp;");
  const html = buildReportHtml(row, "https://x.ru");
  assert.match(html, /&lt;b&gt;Hex&lt;\/b&gt; &amp; не тот/);
  assert.match(html, /#7/);
  assert.ok(!html.includes("Принято"));
  const done = buildReportHtml({ ...row, status: "accepted", edited_by: "Telegram: @ilya" }, "");
  assert.match(done, /✅ Принято<\/b> — Telegram: @ilya/);
});

test("кнопки: статус new — принять/отклонить, иначе — вернуть; http-ссылки не добавляются", () => {
  const kb = reportKeyboard(row, "https://x.ru");
  assert.deepEqual(kb.inline_keyboard[0].map((b) => b.callback_data), ["r:a:7", "r:r:7"]);
  assert.equal(kb.inline_keyboard[1][1].url, "https://x.ru/vehicle/bmw-m5?color=white");
  const back = reportKeyboard({ ...row, status: "accepted" }, "https://x.ru");
  assert.deepEqual(back.inline_keyboard[0].map((b) => b.callback_data), ["r:n:7"]);
  assert.equal(reportKeyboard(row, "http://localhost:5173").inline_keyboard.length, 1);
  assert.equal(reportKeyboard({ ...row, id: undefined }, "https://x.ru"), undefined);
});

test("parseCallback", () => {
  assert.deepEqual(parseCallback("r:a:12"), { status: "accepted", id: 12 });
  assert.deepEqual(parseCallback("r:r:3"), { status: "rejected", id: 3 });
  assert.deepEqual(parseCallback("r:n:3"), { status: "new", id: 3 });
  for (const bad of ["r:x:1", "r:a:", "r:a:1;drop", "", null, "x:a:1"]) assert.equal(parseCallback(bad), null, String(bad));
});

test("authorize: чат, список админов, личный/групповой чат", () => {
  const env = { TELEGRAM_CHAT_ID: "100" };
  assert.equal(authorize({ chat: { id: 100, type: "private" }, from: { id: 100 } }, env), true);
  assert.equal(authorize({ chat: { id: 100, type: "group" }, from: { id: 5 } }, env), false); // группа без списка
  assert.equal(authorize({ chat: { id: 999, type: "private" }, from: { id: 5 } }, env), false); // чужой чат
  const withIds = { ...env, TELEGRAM_ADMIN_IDS: "5, 6" };
  assert.equal(authorize({ chat: { id: 100, type: "group" }, from: { id: 5 } }, withIds), true);
  assert.equal(authorize({ chat: { id: 100, type: "group" }, from: { id: 7 } }, withIds), false);
  assert.deepEqual([...parseAdminIds(withIds)], ["5", "6"]);
});

test("safeEqual и siteUrl", () => {
  assert.equal(safeEqual("abc", "abc"), true);
  assert.equal(safeEqual("abc", "abd"), false);
  assert.equal(safeEqual(undefined, "x"), false);
  assert.equal(siteUrl({ headers: { host: "a.ru" } }, {}), "https://a.ru");
  assert.equal(siteUrl({ headers: { host: "a.ru" } }, { VITE_SITE_URL: "https://b.ru/" }), "https://b.ru");
});

test("tgCall / sendToChat: токен, тема форума, ошибки не бросают", async () => {
  const calls = [];
  const ok = async (url, init) => { calls.push({ url, body: JSON.parse(init.body) }); return { ok: true, status: 200, json: async () => ({ ok: true }) }; };
  assert.deepEqual(await tgCall("x", {}, {}, ok), { ok: false, data: null });
  const env = { TELEGRAM_BOT_TOKEN: "T", TELEGRAM_CHAT_ID: "42", TELEGRAM_THREAD_ID: "9" };
  assert.equal((await sendToChat("hi", {}, env, ok)).ok, true);
  assert.equal(calls[0].url, "https://api.telegram.org/botT/sendMessage");
  assert.equal(calls[0].body.message_thread_id, 9);
  assert.equal(calls[0].body.parse_mode, "HTML");
  const boom = async () => { throw new Error("сеть"); };
  assert.equal((await sendToChat("hi", {}, env, boom)).ok, false);
  const refused = async () => ({ ok: false, status: 400, json: async () => ({ ok: false, description: "bad" }) });
  assert.equal((await tgCall("x", {}, env, refused)).ok, false);
});

test("лента правок: только при TELEGRAM_AUDIT_FEED=1, без звука", async () => {
  const calls = [];
  const fake = async (url, init) => { calls.push(JSON.parse(init.body)); return { ok: true, status: 200, json: async () => ({ ok: true }) }; };
  const entries = [{ edited_by: "Illia", table_name: "vehicles", row_key: "bmw", action: "update" }];
  const env = { TELEGRAM_BOT_TOKEN: "T", TELEGRAM_CHAT_ID: "1" };
  assert.equal(await notifyAudit(entries, env, fake), null);
  await notifyAudit(entries, { ...env, TELEGRAM_AUDIT_FEED: "1" }, fake);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].disable_notification, true);
  assert.match(calls[0].text, /Illia<\/b> · vehicles · <code>bmw<\/code> — правка/);
});
