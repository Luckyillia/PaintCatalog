import { formatColor, hexToRgb } from "./color.js";
import { isValidHex } from "./textUtils.js";

// Форматы копирования цвета. Первые три — как раньше; «r, g, b» и «MTA Lua»
// нужны для скриптов (setVehicleColor принимает числа 0–255).
export const COLOR_FORMATS = [
  { id: "HEX", label: "HEX" },
  { id: "RGB", label: "RGB" },
  { id: "HSL", label: "HSL" },
  { id: "RGBN", label: "r, g, b" },
  { id: "LUA", label: "MTA Lua" },
];

export const COLOR_FORMAT_IDS = COLOR_FORMATS.map((f) => f.id);

function channels(hex) {
  const { r, g, b } = hexToRgb(hex);
  return [r, g, b];
}

export function formatColorExt(hex, fmt = "HEX") {
  if (fmt === "RGBN") return isValidHex(hex) ? channels(hex).join(", ") : hex;
  if (fmt === "LUA") return formatLuaColors([hex]);
  return formatColor(hex, fmt);
}

// Одна строка на окраску: у двухцветной оба цвета идут в один вызов
// (setVehicleColor(veh, r1, g1, b1, r2, g2, b2)).
export function formatLuaColors(hexes) {
  const list = (hexes || []).filter(isValidHex).slice(0, 2);
  if (list.length === 0) return (hexes || [])[0] ?? "";
  return `setVehicleColor(veh, ${list.flatMap(channels).join(", ")})`;
}
