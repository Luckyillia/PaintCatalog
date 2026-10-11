import test from "node:test";
import assert from "node:assert/strict";
import { addSet, removeSet, normalizeSets, MAX_SETS } from "../src/lib/colorSets.js";

const items = [{ slug: "bmw", colorId: "white" }, { slug: "audi", colorId: "red" }];

test("addSet: имя и цвета обязательны", () => {
  assert.ok(addSet([], "  ", items).error);
  assert.ok(addSet([], "Фракция", []).error);
  const r = addSet([], "  Моя   фракция ", items, { now: 1, id: "x" });
  assert.deepEqual(r.sets, [{ id: "x", name: "Моя фракция", items, createdAt: 1 }]);
});

test("набор с тем же именем заменяется, число наборов ограничено", () => {
  const first = addSet([], "A", items, { id: "1" }).sets;
  const again = addSet(first, "a", [items[0]], { id: "2" }).sets;
  assert.equal(again.length, 1);
  assert.equal(again[0].id, "2");
  let sets = [];
  for (let i = 0; i < MAX_SETS + 5; i++) sets = addSet(sets, `n${i}`, items, { id: String(i) }).sets;
  assert.equal(sets.length, MAX_SETS);
});

test("removeSet и normalizeSets чистят мусор", () => {
  assert.deepEqual(removeSet([{ id: "1" }, { id: "2" }], "1"), [{ id: "2" }]);
  assert.deepEqual(normalizeSets("мусор"), []);
  const clean = normalizeSets([null, { name: "", items }, { name: "ok", items: [{ slug: "<x>", colorId: "a" }, ...items] }]);
  assert.equal(clean.length, 1);
  assert.deepEqual(clean[0].items, items);
});
