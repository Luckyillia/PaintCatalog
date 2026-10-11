import test from "node:test";
import assert from "node:assert/strict";
import { bar } from "../api/_lib/telegram.js";
import {
  swatch, parseNav, healthText, topText, carText, findKeyboard, photoUrl, menuKeyboard, auditText, recentText,
} from "../api/_lib/botviews.js";

test("bar: заполнение, границы, мусор", () => {
  assert.equal(bar(5, 10, 10), "▰▰▰▰▰▱▱▱▱▱");
  assert.equal(bar(0, 10, 4), "▱▱▱▱");
  assert.equal(bar(99, 10, 4), "▰▰▰▰");
  assert.equal(bar(1, 0, 4), "▱▱▱▱");
  assert.equal(bar("x", 10, 4), "▱▱▱▱");
});

test("swatch: квадратик по оттенку", () => {
  assert.equal(swatch("#FF0000"), "🟥");
  assert.equal(swatch("#00FF00"), "🟩");
  assert.equal(swatch("#000000"), "⬛");
  assert.equal(swatch("oops"), "▫️");
});

test("parseNav: меню и карточки, мусор отбрасывается", () => {
  assert.deepEqual(parseNav("m:top"), { type: "cmd", cmd: "top" });
  assert.deepEqual(parseNav("v:bmw-m5-f90"), { type: "car", slug: "bmw-m5-f90" });
  for (const bad of ["m:hack", "v:Bad Slug", "v:", "r:a:1", "", null, "v:" + "a".repeat(80)]) {
    assert.equal(parseNav(bad), null, String(bad));
  }
});

test("healthText: оценка и список без обложки", () => {
  const good = { slug: "g", name: "G", image: "/a.jpg", tags: ["t"], colors: [{ id: "w", name: "W", hex: "#FFFFFF", image: "/w.jpg" }] };
  const bad = { slug: "b", name: "<B>", image: "", tags: [], colors: [{ id: "w", name: "W", hex: "#FFFFFF", image: "" }] };
  const t = healthText([good, bad]);
  assert.match(t, /Общая оценка: <b>50%<\/b>/);
  assert.match(t, /▰▰▰▰▰▱▱▱▱▱ 50%/);
  assert.match(t, /&lt;B&gt;/); // имя экранируется
  assert.match(healthText([good]), /100%/);
  assert.match(healthText([]), /пуст/);
});

test("topText: сортировка по данным, неизвестные машины пропускаются", () => {
  const vehicles = [{ slug: "a", name: "A", colors: [{ id: "r", name: "Красный", hex: "#FF0000" }] }, { slug: "b", name: "B", colors: [] }];
  const t = topText({
    vehicleHits: [{ key: "a", count: 10 }, { key: "ghost", count: 99 }, { key: "b", count: 5 }],
    colorHits: [{ key: "a:r", count: 3 }, { key: "a:nope", count: 8 }],
    vehicles,
  });
  assert.match(t, /🥇 A\n {4}▰▰▰▰▰▰▰▰▰▰ 10/);
  assert.match(t, /🥈 B\n {4}▰▰▰▰▰▱▱▱▱▱ 5/);
  assert.ok(!t.includes("ghost"));
  assert.match(t, /🟥 A · Красный/);
  assert.match(topText({ vehicles }), /Данных пока нет/);
});

test("carText: экранирование, двухцветные, лимит длины", () => {
  const colors = Array.from({ length: 40 }, (_, i) => ({ id: `c${i}`, name: `Цвет <${i}>`, hexes: ["#000000", "#FFFFFF"], accentHex: "#FF0000" }));
  const v = { slug: "x", name: "A&B", category: "legkovoy", colors };
  const t = carText(v, ["BMW"], { maxColors: 5, limit: 1000 });
  assert.match(t, /A&amp;B/);
  assert.match(t, /Легковой транспорт/);
  assert.match(t, /⬛⬜ Цвет &lt;0&gt; — <code>#000000<\/code> \+ <code>#FFFFFF<\/code> · вставки/);
  assert.match(t, /…и ещё 35/);
  assert.ok(carText(v, [], { maxColors: 40, limit: 600 }).length <= 600);
  assert.match(carText({ slug: "e", name: "E", category: "moto", colors: [] }), /Цветов пока нет/);
});

test("findKeyboard: длинные slug не попадают в callback_data", () => {
  const ok = { v: { slug: "bmw-m5", name: "BMW M5" } };
  const long = { v: { slug: "a".repeat(70), name: "Long" } };
  const kb = findKeyboard([ok, long]);
  const datas = kb.inline_keyboard.flat().map((b) => b.callback_data);
  assert.ok(datas.includes("v:bmw-m5"));
  assert.ok(datas.every((d) => Buffer.byteLength(d) <= 64));
  assert.ok(datas.includes("m:menu"));
});

test("photoUrl: только https, cloudinary → jpg", () => {
  assert.equal(photoUrl("http://x/a.jpg"), "");
  assert.equal(photoUrl("/images/a.jpg", ""), "");
  assert.equal(photoUrl("/images/a.jpg", "https://s.ru"), "https://s.ru/images/a.jpg");
  assert.equal(
    photoUrl("https://res.cloudinary.com/x/image/upload/v1/a.webp"),
    "https://res.cloudinary.com/x/image/upload/f_jpg,q_auto,c_limit,w_1000/v1/a.webp"
  );
  assert.equal(photoUrl(null), "");
});

test("меню: ссылка на админку только для https", () => {
  assert.equal(menuKeyboard("http://localhost").inline_keyboard.length, 3);
  assert.equal(menuKeyboard("https://x.ru").inline_keyboard.length, 4);
});

test("auditText и recentText: пустые и заполненные списки", () => {
  assert.match(auditText([]), /Записей пока нет/);
  const t = auditText([
    { action: "update", edited_by: "Illia", table_name: "vehicles", row_key: "bmw", created_at: new Date().toISOString() },
    { action: "delete", edited_by: "Illia", table_name: "tags", row_key: "x", created_at: new Date().toISOString() },
  ]);
  assert.match(t, /✏️ <b>Illia<\/b> · vehicles · <code>bmw<\/code>/);
  assert.match(t, /🗑/);
  assert.match(t, /Illia\n {4}▰▰▰▰▰▰▰▰▰▰ 2/);
  assert.match(recentText([]), /Пока ничего/);
  const now = Date.now();
  const r = recentText([{ name: "Новая", category: "moto", colors: [1, 2], created_at: new Date(now - 3600e3).toISOString() }], now);
  assert.match(r, /🆕 <b>Новая<\/b>/);
  assert.match(r, /Мототранспорт · 🎨 2/);
});
