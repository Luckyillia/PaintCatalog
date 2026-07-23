//Legkovoy
import volkswagenJetta from "./legkovoy/volkswagen-jetta";


// Sobytiya
import porsche911RwbSlimer from "./sobytiya/porsche-911-993-rwb-slimer";

export { categories, getCategory } from "../categories";

export const vehicles = [
  volkswagenJetta,
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