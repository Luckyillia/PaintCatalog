import test from "node:test";
import assert from "node:assert/strict";
import { hexToRgb, formatColor, hexToLab, deltaE, parseHex, findClosestColors } from "../src/lib/color.js";

test("hexToRgb / formatColor", () => {
  assert.deepEqual(hexToRgb("#FF8000"), { r: 255, g: 128, b: 0 });
  assert.equal(formatColor("#FF8000", "RGB"), "rgb(255, 128, 0)");
  assert.equal(formatColor("#FF0000", "HSL"), "hsl(0, 100%, 50%)");
  assert.equal(formatColor("#ff0000", "HEX"), "#FF0000");
});

test("deltaE", () => {
  assert.equal(deltaE(hexToLab("#123456"), hexToLab("#123456")), 0);
  assert.ok(deltaE(hexToLab("#000000"), hexToLab("#FFFFFF")) > 99);
});

test("parseHex", () => {
  assert.equal(parseHex("f00"), "#FF0000");
  assert.equal(parseHex("nope"), null);
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
