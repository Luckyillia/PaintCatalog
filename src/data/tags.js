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
  { id: "opel", label: "Opel", group: "brand" },
  { id: "renault", label: "Renault", group: "brand" },
  { id: "peugeot", label: "Peugeot", group: "brand" },
  { id: "citroen", label: "Citroën", group: "brand" },
  { id: "fiat", label: "Fiat", group: "brand" },
  { id: "alfa-romeo", label: "Alfa Romeo", group: "brand" },
  { id: "ferrari", label: "Ferrari", group: "brand" },
  { id: "lamborghini", label: "Lamborghini", group: "brand" },
  { id: "maserati", label: "Maserati", group: "brand" },
  { id: "bentley", label: "Bentley", group: "brand" },
  { id: "rolls-royce", label: "Rolls-Royce", group: "brand" },
  { id: "aston-martin", label: "Aston Martin", group: "brand" },
  { id: "bugatti", label: "Bugatti", group: "brand" },
  { id: "mclaren", label: "McLaren", group: "brand" },
  { id: "jaguar", label: "Jaguar", group: "brand" },
  { id: "land-rover", label: "Land Rover", group: "brand" },
  { id: "mini", label: "Mini", group: "brand" },
  { id: "volvo", label: "Volvo", group: "brand" },
  { id: "saab", label: "Saab", group: "brand" },
  { id: "skoda", label: "Škoda", group: "brand" },
  { id: "seat", label: "Seat", group: "brand" },
  { id: "dodge", label: "Dodge", group: "brand" },
  { id: "chrysler", label: "Chrysler", group: "brand" },
  { id: "cadillac", label: "Cadillac", group: "brand" },
  { id: "buick", label: "Buick", group: "brand" },
  { id: "gmc", label: "GMC", group: "brand" },
  { id: "pontiac", label: "Pontiac", group: "brand" },
  { id: "lincoln", label: "Lincoln", group: "brand" },
  { id: "infiniti", label: "Infiniti", group: "brand" },
  { id: "acura", label: "Acura", group: "brand" },
  { id: "datsun", label: "Datsun", group: "brand" },
  { id: "suzuki", label: "Suzuki", group: "brand" },
  { id: "isuzu", label: "Isuzu", group: "brand" },
  { id: "tesla", label: "Tesla", group: "brand" },
  { id: "zil", label: "ЗИЛ", group: "brand" },
  { id: "izh", label: "ИЖ", group: "brand" },
  { id: "maz", label: "МАЗ", group: "brand" },
  { id: "chery", label: "Chery", group: "brand" },
  { id: "geely", label: "Geely", group: "brand" },
  { id: "haval", label: "Haval", group: "brand" },
  { id: "byd", label: "BYD", group: "brand" },
  { id: "hummer", label: "Hummer", group: "brand" },

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
  { id: "roadster", label: "Родстер", group: "body" },
  { id: "targa", label: "Тарга", group: "body" },
  { id: "muscle-car", label: "Масл-кар", group: "body" },
  { id: "lowrider", label: "Лоурайдер", group: "body" },
  { id: "van", label: "Фургон", group: "body" },
  { id: "microvan", label: "Микровэн", group: "body" },
  { id: "semi-truck", label: "Тягач", group: "body" },
  { id: "dump-truck", label: "Самосвал", group: "body" },
  { id: "tow-truck", label: "Эвакуатор", group: "body" },
  { id: "fire-truck", label: "Пожарная машина", group: "body" },
  { id: "ambulance", label: "Скорая помощь", group: "body" },
  { id: "limousine", label: "Лимузин", group: "body" },
  { id: "buggy", label: "Багги", group: "body" },
  { id: "supercar", label: "Суперкар", group: "body" },
  { id: "hypercar", label: "Гиперкар", group: "body" },

  // Происхождение
  { id: "otechestvenniy", label: "Отечественный", group: "origin" },
  { id: "inomarka", label: "Иномарка", group: "origin" },
  { id: "sovetskiy", label: "Советский", group: "origin" },
  { id: "evropeyskiy", label: "Европейский", group: "origin" },
  { id: "amerikanskiy", label: "Американский", group: "origin" },
  { id: "aziatskiy", label: "Азиатский", group: "origin" },
  { id: "nemetskiy", label: "Немецкий", group: "origin" },
  { id: "yaponskiy", label: "Японский", group: "origin" },
  { id: "koreyskiy", label: "Корейский", group: "origin" },
  { id: "kitayskiy", label: "Китайский", group: "origin" },

  // Эпоха
  { id: "era-50s", label: "50-е", group: "era" },
  { id: "era-60s", label: "60-е", group: "era" },
  { id: "era-70s", label: "70-е", group: "era" },
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
  { id: "widebody", label: "Widebody", group: "special" },
  { id: "lifted", label: "Лифтованный", group: "special" },
  { id: "slammed", label: "Заниженный", group: "special" },
  { id: "jdm", label: "JDM", group: "special" },
  { id: "retro", label: "Ретро", group: "special" },
  { id: "taxi", label: "Такси", group: "special" },
  { id: "military", label: "Военный", group: "special" },
  { id: "vip", label: "VIP", group: "special" },
  { id: "drift", label: "Дрифт", group: "special" },
  { id: "rally", label: "Ралли", group: "special" },
  { id: "concept", label: "Концепт", group: "special" },
  { id: "matte", label: "Матовый", group: "special" },
  { id: "wrap", label: "Плёнка/Wrap", group: "special" },
  { id: "service", label: "Спецтранспорт", group: "special" },
  { id: "racing", label: "Гоночный", group: "special" },
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