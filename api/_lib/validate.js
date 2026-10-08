// Серверная проверка значений перед записью в Supabase. Проверяются только
// те поля, которые реально пришли (для update-патчей), так что частичные
// правки работают.

const HEX = /^#[0-9A-Fa-f]{6}$/;
const SLUG = /^[a-z0-9][a-z0-9-]*$/;

const str = (max, min = 0) => (v) => typeof v === "string" && v.length >= min && v.length <= max;
const slug = (max) => (v) => typeof v === "string" && v.length >= 1 && v.length <= max && SLUG.test(v);
const optSlug = (max) => (v) => v == null || v === "" || slug(max)(v);
const optStr = (max) => (v) => v == null || str(max)(v);
const hex = (v) => typeof v === "string" && HEX.test(v);
const int = (v) => Number.isInteger(v) && Math.abs(v) <= 1_000_000;
// http(s) или путь от корня сайта; javascript: и data: не проходят
const optUrl = (v) => v == null || v === "" || (typeof v === "string" && v.length <= 1500 && /^(https?:\/\/|\/)/i.test(v));
const optHttpUrl = (v) => v == null || v === "" || (typeof v === "string" && v.length <= 1500 && /^https?:\/\//i.test(v));

function colorsOk(colors) {
  if (!Array.isArray(colors) || colors.length > 80) return false;
  const ids = new Set();
  for (const c of colors) {
    if (!c || typeof c !== "object" || Array.isArray(c)) return false;
    if (!slug(60)(c.id) || ids.has(c.id)) return false;
    ids.add(c.id);
    if (!str(80, 1)(c.name)) return false;
    if (c.hexes !== undefined) {
      if (!Array.isArray(c.hexes) || c.hexes.length !== 2 || !c.hexes.every(hex)) return false;
    } else if (!hex(c.hex)) return false;
    if (c.accentHex != null && !hex(c.accentHex)) return false;
    if (!optUrl(c.image)) return false;
  }
  return true;
}

const tagsArr = (v) => Array.isArray(v) && v.length <= 60 && v.every((t) => str(80, 1)(t));
const slugArr = (v) => v == null || (Array.isArray(v) && v.length <= 200 && v.every((s) => slug(80)(s)));

const RULES = {
  vehicles: {
    slug: slug(80),
    category: slug(40),
    name: str(120, 1),
    tags: tagsArr,
    image: optUrl,
    colors: colorsOk,
  },
  tags: { id: slug(80), label: str(60, 1), group_id: slug(80), color: hex, sort_order: int },
  tag_groups: { id: slug(80), label: str(60, 1), sort_order: int },
  credit_groups: { id: slug(80), title: str(120, 1), sort_order: int },
  credit_entries: {
    group_id: slug(80),
    name: str(120, 1),
    role: optStr(120),
    note: optStr(500),
    avatar: optHttpUrl,
    link: optHttpUrl,
    provider_id: optSlug(80),
    vehicle_slugs: slugArr,
    sort_order: int,
  },
};

// Возвращает текст ошибки или null.
export function validateFields(table, obj) {
  const rules = RULES[table];
  if (!rules) return "Неизвестная таблица";
  for (const [field, check] of Object.entries(rules)) {
    if (obj[field] !== undefined && !check(obj[field])) {
      return `Поле «${field}» заполнено некорректно`;
    }
  }
  return null;
}
