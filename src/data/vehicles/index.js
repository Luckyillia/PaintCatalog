//Legkovoy
import volkswagenJetta from "./legkovoy/volkswagen-jetta";
import vaz2108 from "./legkovoy/vaz-2108";
import vaz21011 from "./legkovoy/vaz-21011";
import bmwX6mF96 from "./legkovoy/bmw-x6m-f96";
import bmwM3E46 from "./legkovoy/bmw-m3-e46";
import bmwM5F90 from "./legkovoy/bmw-m5-f90";
import bmwX5E53 from "./legkovoy/bmw-x5-e53";
import chevroletCaprice from "./legkovoy/chevrolet-caprice";
import bmwM6F13 from "./legkovoy/bmw-m6-f13";
import audiA4AllroadQuattro from "./legkovoy/audi-a4-allroad-quattro";
import chevroletTahoeLtz from "./legkovoy/chevrolet-tahoe-ltz";
import volkswagenPassatB3 from "./legkovoy/volkswagen-passat-b3";

// Sobytiya
import bmw850CsiKoenigSpecialsKs8 from "./sobytiya/bmw-850-csi-koenig-specials-ks8";
import porsche911RwbSlimer from "./sobytiya/porsche-911-993-rwb-slimer";
import vaz2108Buran from "./sobytiya/vaz-2108-buran";


// Konteynery
import porsche911993 from "./konteynery/porsche-911-993";


export { categories, getCategory } from "../categories";

export const vehicles = [
  volkswagenPassatB3,
  chevroletTahoeLtz,
  porsche911993,
  audiA4AllroadQuattro,
  bmwM6F13,
  chevroletCaprice,
  bmwX5E53,
  bmwM5F90,
  bmwM3E46,
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