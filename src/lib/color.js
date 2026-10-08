import { isValidHex, normalizeHex } from "./textUtils.js";

export function parseHex(value) {
  const n = normalizeHex(value);
  return isValidHex(n) ? n : null;
}

export function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function rgbToHsl({ r, g, b }) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// fmt: "HEX" | "RGB" | "HSL"
export function formatColor(hex, fmt = "HEX") {
  if (!isValidHex(hex)) return hex;
  if (fmt === "RGB") {
    const { r, g, b } = hexToRgb(hex);
    return `rgb(${r}, ${g}, ${b})`;
  }
  if (fmt === "HSL") {
    const { h, s, l } = rgbToHsl(hexToRgb(hex));
    return `hsl(${h}, ${s}%, ${l}%)`;
  }
  return hex.toUpperCase();
}

function srgbToLinear(c) {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function hexToLab(hex) {
  const { r, g, b } = hexToRgb(hex);
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  const x = (0.4124564 * R + 0.3575761 * G + 0.1804375 * B) / 0.95047;
  const y = 0.2126729 * R + 0.7151522 * G + 0.072175 * B;
  const z = (0.0193339 * R + 0.119192 * G + 0.9503041 * B) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

// ΔE (CIE76): <2 глазом почти не различить, <6 очень близко.
export function deltaE(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

export function findClosestColors(vehicles, hex, limit = 24) {
  const target = hexToLab(hex);
  const out = [];
  for (const vehicle of vehicles) {
    for (const color of vehicle.colors || []) {
      const hexes = (color.hexes ?? [color.hex]).filter(isValidHex);
      if (hexes.length === 0) continue;
      let best = Infinity;
      let bestHex = hexes[0];
      for (const h of hexes) {
        const d = deltaE(target, hexToLab(h));
        if (d < best) {
          best = d;
          bestHex = h;
        }
      }
      out.push({ vehicle, color, hexes, matchHex: bestHex, distance: best });
    }
  }
  out.sort((a, b) => a.distance - b.distance);
  return out.slice(0, limit);
}
