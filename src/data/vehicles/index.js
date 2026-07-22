import zaz968 from "./legkovoy/zaz-968";
import vaz1111Oka from "./legkovoy/vaz-1111-oka";
import vaz21011 from "./legkovoy/vaz-21011";
import moskvich2140 from "./legkovoy/moskvich-2140";
import porsche911RwbSlimer from "./sobytiya/porsche-911-993-rwb-slimer";

export { categories, getCategory } from "../categories";

export const vehicles = [
  zaz968,
  vaz1111Oka,
  vaz21011,
  moskvich2140,
  porsche911RwbSlimer,
];

export function getVehiclesByCategory(slug) {
  return vehicles.filter((v) => v.category === slug);
}

export function getVehicle(slug) {
  return vehicles.find((v) => v.slug === slug);
}

// Цвет может быть одинарным (hex) или двухцветным (hexes: [a, b])
export function getColorHexes(color) {
  return color.hexes ?? [color.hex];
}