import test from "node:test";
import assert from "node:assert/strict";
import {
  hexToRgb,
  rgbToHex,
  formatColor,
  hexToLab,
  deltaE,
  deltaVerdict,
  parseHex,
  swatchBackground,
  colorDistance,
  findClosestColors,
  findSimilarColors,
  colorFamily,
  compareHex,
  sortColorsByHue,
  listColorsByFamily,
} from "../src/lib/color.js";

test("hexToRgb / formatColor", () => {
  assert.deepEqual(hexToRgb("#FF8000"), { r: 255, g: 128, b: 0 });
  assert.equal(formatColor("#FF8000", "RGB"), "rgb(255, 128, 0)");
  assert.equal(formatColor("#FF0000", "HSL"), "hsl(0, 100%, 50%)");
  assert.equal(formatColor("#ff0000", "HEX"), "#FF0000");
});

test("rgbToHex округляет и ограничивает каналы", () => {
  assert.equal(rgbToHex({ r: 255, g: 128, b: 0 }), "#FF8000");
  assert.equal(rgbToHex({ r: 300, g: -5, b: 127.6 }), "#FF0080");
});

test("deltaE", () => {
  assert.equal(deltaE(hexToLab("#123456"), hexToLab("#123456")), 0);
  assert.ok(deltaE(hexToLab("#000000"), hexToLab("#FFFFFF")) > 99);
});

test("deltaVerdict", () => {
  assert.equal(deltaVerdict(0.5), "Практически идентичен");
  assert.equal(deltaVerdict(4), "Очень близко");
  assert.equal(deltaVerdict(8), "Похож");
  assert.equal(deltaVerdict(30), "Заметно отличается");
});

test("parseHex", () => {
  assert.equal(parseHex("f00"), "#FF0000");
  assert.equal(parseHex("nope"), null);
});

test("swatchBackground", () => {
  assert.equal(swatchBackground("#111111"), "#111111");
  assert.equal(swatchBackground(["#111111"]), "#111111");
  assert.equal(swatchBackground(["#111111", "#222222"]), "linear-gradient(135deg, #111111 50%, #222222 50%)");
});

test("findClosestColors", () => {
  const vehicles = [
    { slug: "a", colors: [{ id: "red", hex: "#FF0000" }, { id: "blue", hex: "#0000FF" }] },
    { slug: "b", colors: [{ id: "dark", hexes: ["#111111", "#FE0101"] }] },
  ];
  const res = findClosestColors(vehicles, "#FF0000", 2);
  assert.equal(res[0].color.id, "red");
  assert.equal(res[1].color.id, "dark");
});

test("colorDistance берёт лучшую пару половинок", () => {
  assert.equal(colorDistance(["#FF0000"], ["#FF0000"]), 0);
  assert.ok(colorDistance(["#FF0000"], ["#000000", "#FE0101"]) < 2);
  assert.equal(colorDistance(["nope"], ["#FF0000"]), Infinity);
});

const fleet = [
  { slug: "a", colors: [{ id: "red", hex: "#FF0000" }] },
  { slug: "b", colors: [{ id: "red-ish", hex: "#FE0101" }, { id: "blue", hex: "#0000FF" }] },
  { slug: "c", colors: [{ id: "two", hexes: ["#111111", "#FF0001"] }, { id: "broken", hex: "oops" }] },
  { slug: "d", colors: [] },
];

test("findSimilarColors: близкие цвета других машин, свою машину пропускает", () => {
  const res = findSimilarColors(fleet, ["#FF0000"], { excludeSlug: "a" });
  assert.deepEqual(res.map((r) => `${r.vehicle.slug}:${r.color.id}`), ["c:two", "b:red-ish"]);
  assert.ok(res.every((r) => r.distance <= 3));
  assert.deepEqual(findSimilarColors(fleet, ["#FF0000"], { excludeSlug: "a", maxDelta: 0.001 }), []);
  assert.equal(findSimilarColors(fleet, ["#FF0000"], { limit: 1 }).length, 1);
  assert.deepEqual(findSimilarColors(fleet, [], {}), []);
});

test("colorFamily: основные случаи", () => {
  const cases = {
    "#FF0000": "red", "#00FF00": "green", "#0000FF": "blue", "#FFFF00": "yellow",
    "#FFA500": "orange", "#00FFFF": "cyan", "#800080": "purple", "#FF69B4": "pink",
    "#FFC0CB": "pink", "#8B4513": "brown", "#FFFFFF": "white", "#000000": "black",
    "#808080": "gray", "#0A0A0A": "black", "#F5F5F5": "white",
  };
  for (const [hex, family] of Object.entries(cases)) assert.equal(colorFamily(hex), family, hex);
  assert.equal(colorFamily("nope"), null);
});

test("compareHex / sortColorsByHue: нейтральные по яркости, затем по оттенку", () => {
  const colors = [
    { id: "blue", hex: "#0000FF" },
    { id: "white", hex: "#FFFFFF" },
    { id: "red", hex: "#FF0000" },
    { id: "black", hex: "#000000" },
    { id: "green", hex: "#00FF00" },
    { id: "gray", hex: "#808080" },
  ];
  assert.deepEqual(sortColorsByHue(colors).map((c) => c.id), ["black", "gray", "white", "red", "green", "blue"]);
  assert.equal(compareHex("#123456", "#123456"), 0);
  assert.equal(colors[0].id, "blue"); // исходный массив не меняется
});

test("красные оттенки по обе стороны круга идут подряд", () => {
  const colors = [{ id: "r2", hex: "#FF0020" }, { id: "g", hex: "#00FF00" }, { id: "r1", hex: "#FF2000" }];
  const order = sortColorsByHue(colors).map((c) => c.id);
  assert.equal(order[2], "g");
});

test("listColorsByFamily", () => {
  const res = listColorsByFamily(fleet, "red");
  assert.deepEqual(res.map((r) => r.color.id).sort(), ["red", "red-ish"]);
  assert.deepEqual(listColorsByFamily(fleet, "brown"), []);
});
