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

export function rgbToHex({ r, g, b }) {
  const to = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
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

// Словесная оценка ΔE — одна на весь сайт (поиск по цвету, сравнение).
export function deltaVerdict(d) {
  if (d < 2) return "Практически идентичен";
  if (d < 6) return "Очень близко";
  if (d < 12) return "Похож";
  return "Заметно отличается";
}

// CSS-фон для плашки цвета: одноцветная или «двухцветная» по диагонали.
export function swatchBackground(hexes) {
  const list = Array.isArray(hexes) ? hexes : [hexes];
  return list.length > 1 ? `linear-gradient(135deg, ${list[0]} 50%, ${list[1]} 50%)` : list[0];
}

// Минимальное ΔE между любыми hex из двух наборов (у двухцветных окрасок
// достаточно, чтобы совпала любая из половин).
export function colorDistance(hexesA, hexesB) {
  const labsB = hexesB.filter(isValidHex).map(hexToLab);
  let best = Infinity;
  for (const a of hexesA.filter(isValidHex)) {
    const la = hexToLab(a);
    for (const lb of labsB) best = Math.min(best, deltaE(la, lb));
  }
  return best;
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

// Окраски других машин, неотличимые или очень близкие к заданному цвету.
// excludeSlug — машина, у которой смотрим (её собственные цвета не нужны).
export function findSimilarColors(vehicles, hexes, { excludeSlug, maxDelta = 3, limit = 8 } = {}) {
  const target = (hexes || []).filter(isValidHex);
  if (target.length === 0) return [];
  const out = [];
  for (const vehicle of vehicles) {
    if (vehicle.slug === excludeSlug) continue;
    for (const color of vehicle.colors || []) {
      const candidate = (color.hexes ?? [color.hex]).filter(isValidHex);
      if (candidate.length === 0) continue;
      const distance = colorDistance(target, candidate);
      if (distance <= maxDelta) out.push({ vehicle, color, hexes: candidate, distance });
    }
  }
  out.sort((a, b) => a.distance - b.distance);
  return out.slice(0, limit);
}

// --- оттенки: семейства и сортировка ---------------------------------------

export const COLOR_FAMILIES = [
  { id: "white", label: "Белые", sample: "#F2F2F2" },
  { id: "gray", label: "Серые", sample: "#8A8F95" },
  { id: "black", label: "Чёрные", sample: "#15171A" },
  { id: "red", label: "Красные", sample: "#D12B2B" },
  { id: "orange", label: "Оранжевые", sample: "#EE7B1F" },
  { id: "yellow", label: "Жёлтые", sample: "#F2C81B" },
  { id: "green", label: "Зелёные", sample: "#2E9E4F" },
  { id: "cyan", label: "Бирюзовые", sample: "#1FB5B5" },
  { id: "blue", label: "Синие", sample: "#2F62D6" },
  { id: "purple", label: "Фиолетовые", sample: "#7B3FC4" },
  { id: "pink", label: "Розовые", sample: "#E0559E" },
  { id: "brown", label: "Коричневые", sample: "#7A4A26" },
];

// Грубое «на глаз» семейство цвета (для фильтра). Границы подобраны
// эмпирически и намеренно простые: нужен быстрый обзор, а не колориметрия.
export function colorFamily(hex) {
  if (!isValidHex(hex)) return null;
  const { h, s, l } = rgbToHsl(hexToRgb(hex));
  if (l <= 12) return "black";
  if (s < 12) {
    if (l >= 85) return "white";
    return l <= 18 ? "black" : "gray";
  }
  if (l >= 94) return "white";
  if (h >= 10 && h < 50 && l < 40) return "brown";
  const isRedHue = h < 15 || h >= 345;
  if (isRedHue) return l >= 75 ? "pink" : "red";
  if (h < 42) return "orange";
  if (h < 70) return "yellow";
  if (h < 165) return "green";
  if (h < 200) return "cyan";
  if (h < 255) return "blue";
  if (h < 315) return "purple";
  return "pink";
}

function sortKey(hex) {
  const safe = isValidHex(hex) ? hex : "#000000";
  const { h, s, l } = rgbToHsl(hexToRgb(safe));
  const neutral = s < 12 || l <= 12 || l >= 94;
  // нейтральные — по яркости от тёмных к светлым; цветные — по оттенку
  // (сдвиг на 20°, чтобы красные не разваливались на два конца круга)
  return neutral ? [0, l, 0] : [1, (h + 20) % 360, l];
}

export function compareHex(a, b) {
  const ka = sortKey(a);
  const kb = sortKey(b);
  for (let i = 0; i < ka.length; i++) {
    if (ka[i] !== kb[i]) return ka[i] - kb[i];
  }
  return 0;
}

export function sortColorsByHue(colors) {
  const first = (c) => (c.hexes ?? [c.hex])[0];
  return [...colors].sort((a, b) => compareHex(first(a), first(b)));
}

// Все окраски всех машин, чей основной (первый) hex попадает в семейство.
export function listColorsByFamily(vehicles, family) {
  const out = [];
  for (const vehicle of vehicles) {
    for (const color of vehicle.colors || []) {
      const hexes = (color.hexes ?? [color.hex]).filter(isValidHex);
      if (hexes.length === 0) continue;
      if (colorFamily(hexes[0]) !== family) continue;
      out.push({ vehicle, color, hexes, matchHex: hexes[0] });
    }
  }
  return out.sort((a, b) => compareHex(a.matchHex, b.matchHex));
}
