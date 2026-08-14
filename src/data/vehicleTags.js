// Карта slug → массив id тегов. Отдельно от файлов машин специально,
// чтобы конструктор (File System Access API) продолжал спокойно
// патчить только vehicles/index.js, не зная о тегах.
//
// Когда добавляешь новую машину — просто добавь сюда одну строку
// с её slug и нужными тегами.
//
// ---------------------------------------------------------------------
// СПРАВОЧНИК ВСЕХ ДОСТУПНЫХ ТЕГОВ (актуальный список — см. src/data/tags.js)
// Просто копируй id из нужных групп в массив к своей машине.
// ---------------------------------------------------------------------
//
// Марка:
//   bmw, vaz, volkswagen, porsche, chevrolet, audi, uaz, jeep, lada,
//   nissan, mercedes, toyota, honda, ford, mazda, mitsubishi, subaru,
//   lexus, kia, hyundai, gaz, moskvich, zaz, ural, kamaz
//
// Кузов:
//   sedan, suv, coupe, wagon, hatchback, liftback, pickup, minivan,
//   cabrio, crossover, bus, truck, moto
//
// Происхождение:
//   otechestvenniy, inomarka, sovetskiy, evropeyskiy, amerikanskiy, aziatskiy
//
// Эпоха:
//   era-80s, era-90s, era-2000s, era-2010s, era-2020s
//
// Привод:
//   fwd, rwd, awd
//
// Особое:
//   tuning, limited, sport, offroad, stance, restomod, police, event
//
// ---------------------------------------------------------------------
// Пример разметки новой машины:
//   "moya-mashina-slug": ["bmw", "sedan", "inomarka", "era-2010s", "rwd"],
// ---------------------------------------------------------------------

export const vehicleTags = {
  // legkovoy
  "volkswagen-jetta": ["volkswagen", "sedan", "inomarka"],
  "vaz-2108": ["vaz", "hatchback", "otechestvenniy", "sovetskiy"],
  "vaz-21011": ["vaz", "sedan", "otechestvenniy", "sovetskiy"],
  "bmw-x6m-f96": ["bmw", "suv", "inomarka"],
  "bmw-m3-e46": ["bmw", "coupe", "inomarka"],
  "bmw-m5-f90": ["bmw", "sedan", "inomarka"],
  "bmw-x5-e53": ["bmw", "suv", "inomarka"],
  "chevrolet-caprice": ["chevrolet", "sedan", "inomarka"],
  "bmw-m6-f13": ["bmw", "coupe", "inomarka"],
  "audi-a4-allroad-quattro": ["audi", "wagon", "inomarka"],
  "chevrolet-tahoe-ltz": ["chevrolet", "suv", "inomarka"],
  "volkswagen-passat-b3": ["volkswagen", "wagon", "inomarka"],
  "uaz-patriot": ["uaz", "suv", "otechestvenniy"],
  "jeep-grand-cherokee-zj": ["jeep", "suv", "inomarka"],
  "lada-largus": ["lada", "wagon", "otechestvenniy"],
  "bmw-m5-e60": ["bmw", "sedan", "inomarka"],
  "nissan-400z": ["nissan", "coupe", "inomarka"],
  "nissan-200sx": ["nissan", "coupe", "inomarka", "aziatskiy", "era-90s", "era-80s", "rwd", "sport"],
  "audi-rs6-c7": ["inomarka", "sport", "wagon", "audi", "evropeyskiy", "era-2010s", "awd"],
  "mercedes-s-class-w220": ["inomarka", "evropeyskiy", "mercedes", "sedan", "era-2000s", "rwd"],

  // sobytiya
  "bmw-850-csi-koenig-specials-ks8": ["bmw", "coupe", "inomarka", "tuning"],
  "porsche-911-993-rwb-slimer": ["porsche", "coupe", "inomarka", "tuning"],
  "vaz-2108-buran": ["vaz", "hatchback", "otechestvenniy", "sovetskiy", "tuning"],

  // konteynery
  "porsche-911-993": ["porsche", "coupe", "inomarka"],
};