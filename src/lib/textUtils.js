// Общие текстовые утилиты для админки (конструктор машины, редактор
// машин, теги). Перенесены сюда из старого src/constructor/constructor-source.html
// без изменения логики — просто теперь это обычный ES-модуль.

const TRANSLIT_MAP = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
  у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "",
  э: "e", ю: "yu", я: "ya",
};

export function transliterateStr(str) {
  return (str || "")
    .toLowerCase()
    .split("")
    .map((c) => (TRANSLIT_MAP[c] !== undefined ? TRANSLIT_MAP[c] : c))
    .join("");
}

// Приводит произвольную строку (в т.ч. кириллицу) к формату slug/id,
// который использует весь остальной сайт: строчные латинские буквы,
// цифры, дефисы.
export function sanitizeSlug(value, fallback = "") {
  const v = transliterateStr(value)
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return v || fallback;
}

export function normalizeHex(value) {
  let v = (value || "").trim();
  if (!v) return "";
  if (v[0] !== "#") v = "#" + v;
  return v.toUpperCase();
}

export function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x) => Math.round(255 * x).toString(16).padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

// Золотой угол — используется, чтобы автоматически раздавать новым
// тегам разные, хорошо различимые цвета (как было в старом конструкторе).
export const GOLDEN_ANGLE = 137.508;

let uidCounter = 0;
export function nextUid() {
  uidCounter += 1;
  return `row-${uidCounter}-${Date.now()}`;
}


export function formatRelativeTime(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  const diffMin = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return "только что";
  if (diffMin < 60) return `${diffMin} мин. назад`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH} ч. назад`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 30) return `${diffD} дн. назад`;
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}