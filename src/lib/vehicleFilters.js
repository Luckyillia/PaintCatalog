import { colorFamily } from "./color.js";

export const SORTS = [
  { id: "name", label: "По названию" },
  { id: "new", label: "Сначала новые" },
  { id: "colors", label: "Больше цветов" },
];

export function colorFamilyOf(color) {
  return colorFamily((color?.hexes ?? [color?.hex])[0]);
}

// Семейства цветов, которые есть у машины (по основному hex каждой окраски).
export function vehicleFamilies(vehicle) {
  const out = new Set();
  for (const c of vehicle?.colors || []) {
    const f = colorFamilyOf(c);
    if (f) out.add(f);
  }
  return out;
}

export function filterByFamily(list, family) {
  return family ? list.filter((v) => vehicleFamilies(v).has(family)) : list;
}

export function sortVehicles(list, sort = "name") {
  const byName = (a, b) => a.name.localeCompare(b.name, "ru");
  const copy = [...list];
  if (sort === "new") {
    return copy.sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0) || byName(a, b));
  }
  if (sort === "colors") {
    return copy.sort((a, b) => (b.colors?.length || 0) - (a.colors?.length || 0) || byName(a, b));
  }
  return copy.sort(byName);
}
