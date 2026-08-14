// Реестр всех тегов сайта. group используется только для группировки
// в фильтре и конструкторе — цвет у каждого тега свой собственный.
export const tagGroups = [
  { id: "brand", label: "Марка" },
  { id: "body", label: "Кузов" },
  { id: "origin", label: "Происхождение" },
  { id: "era", label: "Эпоха" },
  { id: "drive", label: "Привод" },
  { id: "special", label: "Особое" },
];

const rawTags = [
  // Марка
  { id: "bmw", label: "BMW", group: "brand" },
  { id: "vaz", label: "ВАЗ", group: "brand" },
  { id: "volkswagen", label: "Volkswagen", group: "brand" },
  { id: "porsche", label: "Porsche", group: "brand" },
  { id: "chevrolet", label: "Chevrolet", group: "brand" },
  { id: "audi", label: "Audi", group: "brand" },
  { id: "uaz", label: "УАЗ", group: "brand" },
  { id: "jeep", label: "Jeep", group: "brand" },
  { id: "lada", label: "Lada", group: "brand" },
  { id: "nissan", label: "Nissan", group: "brand" },
  { id: "mercedes", label: "Mercedes-Benz", group: "brand" },
  { id: "toyota", label: "Toyota", group: "brand" },
  { id: "honda", label: "Honda", group: "brand" },
  { id: "ford", label: "Ford", group: "brand" },
  { id: "mazda", label: "Mazda", group: "brand" },
  { id: "mitsubishi", label: "Mitsubishi", group: "brand" },
  { id: "subaru", label: "Subaru", group: "brand" },
  { id: "lexus", label: "Lexus", group: "brand" },
  { id: "kia", label: "Kia", group: "brand" },
  { id: "hyundai", label: "Hyundai", group: "brand" },
  { id: "gaz", label: "ГАЗ", group: "brand" },
  { id: "moskvich", label: "Москвич", group: "brand" },
  { id: "zaz", label: "ЗАЗ", group: "brand" },
  { id: "ural", label: "Урал", group: "brand" },
  { id: "kamaz", label: "КамАЗ", group: "brand" },

  // Кузов
  { id: "sedan", label: "Седан", group: "body" },
  { id: "suv", label: "Внедорожник", group: "body" },
  { id: "coupe", label: "Купе", group: "body" },
  { id: "wagon", label: "Универсал", group: "body" },
  { id: "hatchback", label: "Хэтчбек", group: "body" },
  { id: "liftback", label: "Лифтбек", group: "body" },
  { id: "pickup", label: "Пикап", group: "body" },
  { id: "minivan", label: "Минивэн", group: "body" },
  { id: "cabrio", label: "Кабриолет", group: "body" },
  { id: "crossover", label: "Кроссовер", group: "body" },
  { id: "bus", label: "Автобус", group: "body" },
  { id: "truck", label: "Грузовик", group: "body" },
  { id: "moto", label: "Мотоцикл", group: "body" },

  // Происхождение
  { id: "otechestvenniy", label: "Отечественный", group: "origin" },
  { id: "inomarka", label: "Иномарка", group: "origin" },
  { id: "sovetskiy", label: "Советский", group: "origin" },
  { id: "evropeyskiy", label: "Европейский", group: "origin" },
  { id: "amerikanskiy", label: "Американский", group: "origin" },
  { id: "aziatskiy", label: "Азиатский", group: "origin" },

  // Эпоха
  { id: "era-80s", label: "80-е", group: "era" },
  { id: "era-90s", label: "90-е", group: "era" },
  { id: "era-2000s", label: "2000-е", group: "era" },
  { id: "era-2010s", label: "2010-е", group: "era" },
  { id: "era-2020s", label: "2020-е", group: "era" },

  // Привод
  { id: "fwd", label: "Передний привод", group: "drive" },
  { id: "rwd", label: "Задний привод", group: "drive" },
  { id: "awd", label: "Полный привод", group: "drive" },

  // Особое
  { id: "tuning", label: "Тюнинг", group: "special" },
  { id: "limited", label: "Лимитка", group: "special" },
  { id: "sport", label: "Спорт", group: "special" },
  { id: "offroad", label: "Оффроуд", group: "special" },
  { id: "stance", label: "Stance", group: "special" },
  { id: "restomod", label: "Рестомод", group: "special" },
  { id: "police", label: "Полиция", group: "special" },
  { id: "event", label: "Ивентовый", group: "special" },
];

// Каждому тегу присваивается свой уникальный цвет через поворот на
// золотой угол (137.508°) — гарантирует, что цвета не повторяются
// и хорошо различимы, даже если список тегов сильно вырастет.
function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x) => Math.round(255 * x).toString(16).padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

const GOLDEN_ANGLE = 137.508;
export const tags = rawTags.map((tag, i) => ({
  ...tag,
  color: hslToHex((i * GOLDEN_ANGLE) % 360, 68, 58),
}));

export function getTag(id) {
  return tags.find((t) => t.id === id);
}

export function getTagColor(id) {
  return getTag(id)?.color ?? "#8b95a1";
}