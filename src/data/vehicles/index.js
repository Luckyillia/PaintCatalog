//Legkovoy
import volkswagenJetta from "./legkovoy/volkswagen-jetta";
import vaz2108 from "./legkovoy/vaz-2108";
import vaz21011 from "./legkovoy/vaz-21011";
import bmwX6mF96 from "./legkovoy/bmw-x6m-f96";

// Sobytiya
import bmw850CsiKoenigSpecialsKs8 from "./sobytiya/bmw-850-csi-koenig-specials-ks8";
import porsche911RwbSlimer from "./sobytiya/porsche-911-993-rwb-slimer";
import vaz2108Buran from "./sobytiya/vaz-2108-buran";

export { categories, getCategory } from "../categories";

export const vehicles = [
  bmwX6mF96,
  vaz21011,
  vaz2108,
  vaz2108Buran,
  bmw850CsiKoenigSpecialsKs8,
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