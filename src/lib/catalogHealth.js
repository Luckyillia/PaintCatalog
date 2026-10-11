import { isValidHex } from "./textUtils.js";

// «Здоровье каталога»: что в машинах осталось дозаполнить. Чистая функция.
export function analyzeCatalog(vehicles) {
  const noCover = [];
  const noColors = [];
  const noTags = [];
  const colorsNoPhoto = [];
  const duplicateHex = [];

  for (const v of vehicles || []) {
    const colors = v.colors || [];
    if (!v.image) noCover.push(v);
    if (colors.length === 0) noColors.push(v);
    if (!v.tags || v.tags.length === 0) noTags.push(v);

    const missing = colors.filter((c) => !c.image).length;
    if (missing > 0) colorsNoPhoto.push({ vehicle: v, count: missing, total: colors.length });

    const byHex = new Map();
    for (const c of colors) {
      const hexes = (c.hexes ?? [c.hex]).filter(isValidHex).map((h) => h.toUpperCase());
      if (hexes.length === 0) continue;
      const key = hexes.join("/");
      byHex.set(key, [...(byHex.get(key) || []), c.name]);
    }
    const groups = [...byHex.entries()].filter(([, names]) => names.length > 1).map(([hex, names]) => ({ hex, names }));
    if (groups.length > 0) duplicateHex.push({ vehicle: v, groups });
  }

  const issues = noCover.length + noColors.length + noTags.length + colorsNoPhoto.length + duplicateHex.length;
  return { total: (vehicles || []).length, issues, noCover, noColors, noTags, colorsNoPhoto, duplicateHex };
}
