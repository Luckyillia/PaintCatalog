import test from "node:test";
import assert from "node:assert/strict";
import { swapLayout, translitVariants, levenshtein, queryVariants, searchCatalog } from "../src/lib/search.js";

const vehicles = [
  { name: "BMW M5 F90", slug: "bmw-m5-f90", category: "legkovoy", tags: ["brand-bmw"], colors: [{ id: "white", name: "Белый", hex: "#FFFFFF" }, { id: "black", name: "Чёрный", hex: "#111111" }] },
  { name: "Audi RS6 C7", slug: "audi-rs6-c7", category: "legkovoy", tags: [], colors: [{ id: "g", name: "Серый", hex: "#808080" }] },
  { name: "Mercedes C200 W206", slug: "mercedes-c200-w206", category: "legkovoy", tags: [], colors: [] },
];
const tags = [{ id: "brand-bmw", label: "BMW" }];
const find = (q) => searchCatalog(vehicles, tags, q, { categoryName: () => "Легковой" });

test("swapLayout: русская раскладка ↔ английская", () => {
  assert.equal(swapLayout("фгвш"), "audi");
  assert.equal(swapLayout("audi"), "фгвш");
  assert.equal(swapLayout("m5"), "m5");
});

test("translitVariants даёт варианты в/w и к/c", () => {
  assert.ok(translitVariants("бмв").includes("bmw"));
  assert.ok(translitVariants("кадиллак").includes("cadillac"));
  assert.deepEqual(translitVariants("bmw"), []);
});

test("levenshtein с порогом", () => {
  assert.equal(levenshtein("kitten", "sitting"), 3);
  assert.equal(levenshtein("abc", "abc", 1), 0);
  assert.equal(levenshtein("abcdef", "uvwxyz", 2), 3);
});

test("queryVariants: алиасы и раскладка", () => {
  assert.ok(queryVariants("бэха").includes("bmw"));
  assert.ok(queryVariants("фгвш").includes("audi"));
});

test("точное совпадение, порядок слов не важен", () => {
  assert.equal(find("bmw").results[0].v.slug, "bmw-m5-f90");
  assert.equal(find("m5 bmw").results[0].v.slug, "bmw-m5-f90");
  assert.equal(find("bmw").fuzzy, false);
});

test("русское название и неверная раскладка находят машину", () => {
  const a = find("бмв");
  assert.equal(a.results[0].v.slug, "bmw-m5-f90");
  assert.equal(a.used, "bmw");
  assert.equal(find("фгвш").results[0].v.slug, "audi-rs6-c7");
});

test("цвет (с ё) и hex", () => {
  const r = find("чёрный").results[0];
  assert.equal(r.colorId, "black");
  assert.equal(find("чёрный").results[0].v.slug, "bmw-m5-f90");
  assert.equal(find("#808080").results[0].v.slug, "audi-rs6-c7");
});

test("опечатка → «возможно, вы искали»", () => {
  const r = find("mersedes");
  assert.equal(r.fuzzy, true);
  assert.equal(r.results[0].v.slug, "mercedes-c200-w206");
});

test("пустой и бессмысленный запрос", () => {
  assert.deepEqual(find("   ").results, []);
  assert.deepEqual(find("zzzzqqq").results, []);
});
