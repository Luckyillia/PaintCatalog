import test from "node:test";
import assert from "node:assert/strict";
import {
  validateReport,
  hashIp,
  exceedsLimits,
  LIMIT_PER_HOUR,
  LIMIT_PER_DAY,
  MIN_FILL_MS,
} from "../api/_lib/reports.js";

const base = { elapsedMs: MIN_FILL_MS + 500, website: "" };

test("ошибка в цвете: корректный репорт", () => {
  const r = validateReport({ ...base, kind: "color_error", vehicleSlug: "bmw-m5-f90", colorId: "white", message: "  Hex не тот  ", contact: " vk.com/x " });
  assert.deepEqual(r.row, {
    kind: "color_error",
    vehicle_slug: "bmw-m5-f90",
    color_id: "white",
    message: "Hex не тот",
    contact: "vk.com/x",
    payload: null,
  });
});

test("ловушка и слишком быстрая отправка считаются спамом", () => {
  assert.equal(validateReport({ ...base, website: "http://spam", kind: "color_error", vehicleSlug: "a", message: "12345" }).spam, true);
  assert.equal(validateReport({ ...base, elapsedMs: 100, kind: "color_error", vehicleSlug: "a", message: "12345" }).spam, true);
  assert.equal(validateReport({ kind: "color_error", vehicleSlug: "a", message: "12345" }).spam, true);
});

test("не объект и неизвестный тип", () => {
  assert.ok(validateReport(null).error);
  assert.ok(validateReport([]).error);
  assert.ok(validateReport({ ...base, kind: "hack", message: "12345" }).error);
});

test("короткое сообщение отклоняется", () => {
  assert.ok(validateReport({ ...base, kind: "color_error", vehicleSlug: "a", message: "ага" }).error);
});

test("color_error: нужна корректная машина и цвет", () => {
  assert.ok(validateReport({ ...base, kind: "color_error", message: "12345" }).error);
  assert.ok(validateReport({ ...base, kind: "color_error", vehicleSlug: "Bad Slug", message: "12345" }).error);
  assert.ok(validateReport({ ...base, kind: "color_error", vehicleSlug: "a", colorId: "x y", message: "12345" }).error);
  assert.equal(validateReport({ ...base, kind: "color_error", vehicleSlug: "a", message: "12345" }).row.color_id, null);
});

test("new_vehicle: название обязательно, данные уходят в payload", () => {
  assert.ok(validateReport({ ...base, kind: "new_vehicle", message: "12345" }).error);
  const r = validateReport({ ...base, kind: "new_vehicle", name: "  ЗАЗ   968  ", category: "legkovoy", colors: "Белый #FFFFFF", message: "Видел на сервере" });
  assert.equal(r.row.vehicle_slug, null);
  assert.deepEqual(r.row.payload, { name: "ЗАЗ 968", category: "legkovoy", colors: "Белый #FFFFFF" });
  assert.ok(validateReport({ ...base, kind: "new_vehicle", name: "ЗАЗ", category: "Bad Cat", message: "12345" }).error);
});

test("new_vehicle: комментарий необязателен, но если есть — не короче 5 символов", () => {
  const r = validateReport({ ...base, kind: "new_vehicle", name: "ЗАЗ 968" });
  assert.equal(r.row.message, "Предложение машины: ЗАЗ 968");
  assert.ok(validateReport({ ...base, kind: "new_vehicle", name: "ЗАЗ 968", message: "ага" }).error);
  // для ошибки в цвете комментарий по-прежнему обязателен
  assert.ok(validateReport({ ...base, kind: "color_error", vehicleSlug: "a" }).error);
});

test("длинные поля обрезаются, управляющие символы вычищаются", () => {
  const r = validateReport({ ...base, kind: "color_error", vehicleSlug: "a", message: "a\u0000b".repeat(800), contact: "c".repeat(500) });
  assert.equal(r.row.message.length, 1000);
  assert.ok(!r.row.message.includes("\u0000"));
  assert.equal(r.row.contact.length, 120);
});

test("hashIp: стабильный, зависит от соли, не содержит IP", () => {
  const a = hashIp("1.2.3.4", "salt");
  assert.equal(a, hashIp("1.2.3.4", "salt"));
  assert.notEqual(a, hashIp("1.2.3.4", "other"));
  assert.notEqual(a, hashIp("1.2.3.5", "salt"));
  assert.match(a, /^[0-9a-f]{64}$/);
});

test("exceedsLimits: почасовой и дневной лимиты", () => {
  const now = Date.parse("2026-10-11T12:00:00Z");
  const ago = (min) => new Date(now - min * 60000).toISOString();
  assert.equal(exceedsLimits([], now), null);
  assert.equal(exceedsLimits(Array.from({ length: LIMIT_PER_HOUR - 1 }, () => ago(10)), now), null);
  assert.equal(exceedsLimits(Array.from({ length: LIMIT_PER_HOUR }, () => ago(10)), now), "hour");
  // старше часа в часовой лимит не входят, но входят в дневной
  assert.equal(exceedsLimits(Array.from({ length: LIMIT_PER_HOUR }, () => ago(120)), now), null);
  assert.equal(exceedsLimits(Array.from({ length: LIMIT_PER_DAY }, () => ago(120)), now), "day");
  // старше суток не считаются
  assert.equal(exceedsLimits(Array.from({ length: 50 }, () => ago(60 * 25)), now), null);
  assert.equal(exceedsLimits(["мусор", null], now), null);
});
