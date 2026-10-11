import test from "node:test";
import assert from "node:assert/strict";
import { parseImport, parseCsv, mergeWithExisting } from "../src/lib/vehicleImport.js";

const CATS = ["legkovoy", "moto"];

test("parseCsv: разделители, кавычки, BOM", () => {
  assert.deepEqual(parseCsv("\uFEFFa;b\n1;\"x;y\"\n"), [["a", "b"], ["1", "x;y"]]);
  assert.deepEqual(parseCsv("a,b\r\n\"q\"\"w\",2"), [["a", "b"], ['q"w', "2"]]);
});

test("JSON: корректная машина нормализуется", () => {
  const json = JSON.stringify([{ name: "BMW M5", category: "legkovoy", tags: "brand-bmw|era", colors: [{ name: "Белый", hex: "fff" }, { name: "Duo", hexes: ["#111", "#222222"], accent: "#f00" }] }]);
  const r = parseImport(json, CATS);
  assert.deepEqual(r.errors, []);
  const v = r.vehicles[0];
  assert.equal(v.slug, "bmw-m5");
  assert.deepEqual(v.tags, ["brand-bmw", "era"]);
  assert.deepEqual(v.colors[0], { id: "belyy", name: "Белый", image: "", hex: "#FFFFFF" });
  assert.deepEqual(v.colors[1].hexes, ["#111111", "#222222"]);
  assert.equal(v.colors[1].accentHex, "#FF0000");
});

test("CSV: строки с одним slug собираются в машину", () => {
  const csv = "slug;category;name;tags;image;color_id;color_name;hex;hex2;accent;color_image\n" +
    "a;legkovoy;A;t1;;w;Белый;#FFFFFF;;;\n" +
    "a;legkovoy;A;;;b;Чёрный;#000000;#111111;;\n" +
    "m;moto;M;;;r;Красный;#FF0000;;;\n";
  const r = parseImport(csv, CATS);
  assert.deepEqual(r.errors, []);
  assert.equal(r.vehicles.length, 2);
  assert.equal(r.vehicles[0].colors.length, 2);
  assert.deepEqual(r.vehicles[0].colors[1].hexes, ["#000000", "#111111"]);
  assert.deepEqual(r.vehicles[0].tags, ["t1"]);
});

test("ошибки: категория, hex, дубли, main, повтор slug", () => {
  const bad = [
    { name: "A", category: "xxx", colors: [{ name: "c", hex: "#FFFFFF" }] },
    { name: "B", category: "moto", colors: [{ name: "c", hex: "nope" }] },
    { name: "C", category: "moto", colors: [{ name: "x", hex: "#FFFFFF" }, { name: "x", hex: "#000000" }] },
    { name: "D", category: "moto", colors: [{ id: "main", name: "m", hex: "#FFFFFF" }] },
    { name: "E", category: "moto", colors: [{ name: "e", hex: "#FFFFFF" }] },
    { name: "E", category: "moto", colors: [{ name: "e", hex: "#FFFFFF" }] },
  ];
  const r = parseImport(JSON.stringify(bad), CATS);
  assert.equal(r.vehicles.length, 1);
  assert.equal(r.errors.length, 5);
  assert.ok(parseImport("{oops", CATS).errors[0].startsWith("JSON"));
  assert.ok(parseImport("a;b\n1;2", CATS).errors[0].includes("category"));
  assert.deepEqual(parseImport("  ", CATS), { vehicles: [], errors: [] });
});

test("mergeWithExisting не стирает фото и теги", () => {
  const old = { image: "/cover.jpg", tags: ["t"], colors: [{ id: "w", image: "/w.jpg" }] };
  const imp = { slug: "a", image: "", tags: [], colors: [{ id: "w", name: "W", image: "", hex: "#FFFFFF" }, { id: "n", name: "N", image: "", hex: "#000000" }] };
  const m = mergeWithExisting(imp, old);
  assert.equal(m.image, "/cover.jpg");
  assert.deepEqual(m.tags, ["t"]);
  assert.equal(m.colors[0].image, "/w.jpg");
  assert.equal(m.colors[1].image, "");
});
