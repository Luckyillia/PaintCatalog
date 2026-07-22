// Заглушечные данные. Структура рассчитана на то, чтобы позже
// заменить значения на реальные (фото, hex-коды, характеристики),
// не трогая компоненты.

export const categories = [
  { slug: "legkovoy", name: "Легковой транспорт" },
  { slug: "gruzovoy", name: "Грузовой транспорт" },
  { slug: "obshestvenniy", name: "Общественный транспорт" },
  { slug: "moto", name: "Мототранспорт" },
  { slug: "konteynery", name: "Автомобили из контейнеров" },
  { slug: "sobytiya", name: "Автомобили из событий" },
];

// Каждый цвет — один "стоковый" вариант окраски машины.
// hex обязателен, ingame — заглушка под скрин "как это выглядит в игре".
const zazColors = [
  { id: "white", name: "Белый жемчуг", hex: "#EDEFF1" },
  { id: "sky", name: "Небесный", hex: "#8FB6D9" },
  { id: "olive", name: "Олива", hex: "#6E7550" },
  { id: "cherry", name: "Вишня", hex: "#7A1F2B" },
  { id: "sand", name: "Песочный", hex: "#C9B48A" },
];

const okaColors = [
  { id: "white", name: "Белый", hex: "#E9EBEC" },
  { id: "red", name: "Красный мак", hex: "#B23A2E" },
  { id: "blue", name: "Синий Ока", hex: "#3B5C82" },
  { id: "beige", name: "Бежевый", hex: "#CBB994" },
];

const vazColors = [
  { id: "white", name: "Белый", hex: "#E7E9EA" },
  { id: "green", name: "Изумруд", hex: "#3E6B4F" },
  { id: "black", name: "Чёрный лак", hex: "#1A1B1D" },
  { id: "graphite", name: "Графит", hex: "#4B4E52" },
  { id: "gold", name: "Золотистый", hex: "#B99A4E" },
];

const moskvichColors = [
  { id: "white", name: "Белый", hex: "#E6E8E9" },
  { id: "brown", name: "Табак", hex: "#5B4632" },
  { id: "blue", name: "Балтика", hex: "#2E4E6E" },
  { id: "burgundy", name: "Бордо", hex: "#5C2430" },
];

export const vehicles = [
  {
    slug: "zaz-968",
    category: "legkovoy",
    name: 'ЗАЗ-968 «Запорожец»',
    dealership: "АвтоМакс (Невский)",
    priceDealer: 35000,
    priceMarket: 31500,
    specs: {
      maxSpeed: "120 км/ч",
      accel100: "27.58 сек.",
      accelMax: "40.25 сек.",
      drive: "Задний",
      bodyType: "Седан",
      seats: 2,
      trunk: 4,
    },
    colors: zazColors,
  },
  {
    slug: "vaz-1111-oka",
    category: "legkovoy",
    name: "ВАЗ-1111 Ока",
    dealership: "АвтоМакс (Невский)",
    priceDealer: 55000,
    priceMarket: 49500,
    specs: {
      maxSpeed: "130 км/ч",
      accel100: "20.42 сек.",
      accelMax: "34.85 сек.",
      drive: "Передний",
      bodyType: "Хэтчбек",
      seats: 4,
      trunk: 4,
    },
    colors: okaColors,
  },
  {
    slug: "vaz-21011",
    category: "legkovoy",
    name: "ВАЗ-21011",
    dealership: "АвтоМакс (Невский)",
    priceDealer: 60000,
    priceMarket: 54000,
    specs: {
      maxSpeed: "155 км/ч",
      accel100: "16.19 сек.",
      accelMax: "34.65 сек.",
      drive: "Задний",
      bodyType: "Седан",
      seats: 4,
      trunk: 10,
    },
    colors: vazColors,
  },
  {
    slug: "moskvich-2140",
    category: "legkovoy",
    name: "Москвич-2140",
    dealership: "АвтоМакс (Невский)",
    priceDealer: 68000,
    priceMarket: 61200,
    specs: {
      maxSpeed: "142 км/ч",
      accel100: "14.87 сек.",
      accelMax: "26.67 сек.",
      drive: "Задний",
      bodyType: "Седан",
      seats: 4,
      trunk: 10,
    },
    colors: moskvichColors,
  },
];

export function getCategory(slug) {
  return categories.find((c) => c.slug === slug);
}

export function getVehiclesByCategory(slug) {
  return vehicles.filter((v) => v.category === slug);
}

export function getVehicle(slug) {
  return vehicles.find((v) => v.slug === slug);
}
