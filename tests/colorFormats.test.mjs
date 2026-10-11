import test from "node:test";
import assert from "node:assert/strict";
import { formatColorExt, formatLuaColors, COLOR_FORMAT_IDS } from "../src/lib/colorFormats.js";

test("форматы для скриптов", () => {
  assert.equal(formatColorExt("#FF8000", "RGBN"), "255, 128, 0");
  assert.equal(formatColorExt("#FF8000", "LUA"), "setVehicleColor(veh, 255, 128, 0)");
  assert.equal(formatColorExt("#FF8000", "HEX"), "#FF8000");
  assert.equal(formatColorExt("#FF0000", "RGB"), "rgb(255, 0, 0)");
  assert.equal(formatColorExt("oops", "RGBN"), "oops");
});

test("Lua: двухцветная окраска — один вызов", () => {
  assert.equal(formatLuaColors(["#000000", "#FFFFFF"]), "setVehicleColor(veh, 0, 0, 0, 255, 255, 255)");
  assert.equal(formatLuaColors(["bad"]), "bad");
  assert.ok(COLOR_FORMAT_IDS.includes("LUA"));
});
