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
import uazPatriot from "./legkovoy/uaz-patriot";
import jeepGrandCherokeeZj from "./legkovoy/jeep-grand-cherokee-zj";
import ladaLargus from "./legkovoy/lada-largus";
import bmwM5E60 from "./legkovoy/bmw-m5-e60";
import nissan400z from "./legkovoy/nissan-400z";
import nissan200sx from "./legkovoy/nissan-200sx";
import audiRs6C7 from "./legkovoy/audi-rs6-c7";
import mercedesSClassW220 from "./legkovoy/mercedes-s-class-w220";
import audiQ72013 from "./legkovoy/audi-q7-2013";
import cadillacEscalade from "./legkovoy/cadillac-escalade";
import subaruForesterSg9 from "./legkovoy/subaru-forester-sg-9";
import chevroletSuburban from "./legkovoy/chevrolet-suburban";
import lexusLfa from "./legkovoy/lexus-lfa";
import mercedesC200W206 from "./legkovoy/mercedes-c200-w206";
import hummerH2 from "./legkovoy/hummer-h2";
import volkswagenPolo from "./legkovoy/volkswagen-polo";
import maseratiGranturismo from "./legkovoy/maserati-granturismo";
import bmwZ4 from "./legkovoy/bmw-z4";
import nissanGtRR35 from "./legkovoy/nissan-gt-r-r35";
import bmwM4F82 from "./legkovoy/bmw-m4-f82";

// Sobytiya
import bmw850CsiKoenigSpecialsKs8 from "./sobytiya/bmw-850-csi-koenig-specials-ks8";
import porsche911RwbSlimer from "./sobytiya/porsche-911-993-rwb-slimer";
import vaz2108Buran from "./sobytiya/vaz-2108-buran";
import dodgeCharger10Years from "./sobytiya/dodge-charger-10-years";

// Konteynery
import hondaNsx from "./konteynery/honda-nsx";
import porsche911993 from "./konteynery/porsche-911-993";
import ferrari348Gtb from "./konteynery/ferrari-348-gtb";

// Moto
import suzukiHayabusa from "./moto/suzuki-hayabusa";

import { tags } from "../tags";


export { categories, getCategory } from "../categories";
export { tags, tagGroups, getTag, getTagColor } from "../tags";

// Теги каждой машины теперь живут прямо в её файле (поле `tags`),
// отдельный src/data/vehicleTags.js больше не используется —
// его можно удалить из проекта.
export const vehicles = [
  bmwZ4,
  hummerH2,
  volkswagenPolo,
  maseratiGranturismo,
  mercedesC200W206,
  lexusLfa,
  chevroletSuburban,
  subaruForesterSg9,
  cadillacEscalade,
  audiQ72013,
  ferrari348Gtb,
  dodgeCharger10Years,
  hondaNsx,
  mercedesSClassW220,
  audiRs6C7,
  nissan200sx,
  nissan400z,
  bmwM5E60,
  ladaLargus,
  jeepGrandCherokeeZj,
  uazPatriot,
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
  suzukiHayabusa,
  nissanGtRR35,
  bmwM4F82,
];

export function getVehiclesByCategory(slug) {
  return vehicles.filter((v) => v.category === slug);
}

export function getVehicle(slug) {
  return vehicles.find((v) => v.slug === slug);
}

// Фильтрация списка машин по выбранным тегам (логика "ИЛИ" —
// машина попадает в результат, если содержит хотя бы один из tagIds)
export function getVehiclesByTags(list, tagIds) {
  if (!tagIds || tagIds.length === 0) return list;
  return list.filter((v) => v.tags?.some((t) => tagIds.includes(t)));
}

// Какие теги реально встречаются в данном списке машин
// (чтобы не показывать в фильтре теги, которых тут нет),
// отсортированные в постоянном порядке — как они объявлены
// в реестре src/data/tags.js (группа за группой).
export function getUsedTagIds(list) {
  const set = new Set();
  list.forEach((v) => v.tags?.forEach((t) => set.add(t)));

  const order = new Map(tags.map((t, i) => [t.id, i]));
  return Array.from(set).sort((a, b) => (order.get(a) ?? 999) - (order.get(b) ?? 999));
}

// Цвет может быть одинарным (hex) или двухцветным (hexes: [a, b])
export function getColorHexes(color) {
  return color.hexes ?? [color.hex];
}

// Необязательный третий цвет — вставки/акценты (например у мото).
// Если не задан — null.
export function getColorAccentHex(color) {
  return color.accentHex ?? null;
}