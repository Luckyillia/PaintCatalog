// Поиск по каталогу, который прощает неверную раскладку, русские названия
// марок («бмв» → bmw) и опечатки. Чистая логика, проверяется тестами.

const RU = "йцукенгшщзхъфывапролджэячсмитьбю";
const EN = "qwertyuiop[]asdfghjkl;'zxcvbnm,.";
const RU_TO_EN = new Map([...RU].map((c, i) => [c, EN[i]]));
const EN_TO_RU = new Map([...EN].map((c, i) => [c, RU[i]]));

const ALIASES = {
  бэха: "bmw", бумер: "bmw", бмв: "bmw", мерс: "mercedes", мерседес: "mercedes",
  фольксваген: "volkswagen", фолькс: "volkswagen", вольво: "volvo", ваз: "vaz",
  лада: "lada", шевроле: "chevrolet", шеви: "chevrolet", порше: "porsche",
  феррари: "ferrari", ламборгини: "lamborghini", ниссан: "nissan", субару: "subaru",
  мазда: "mazda", кадиллак: "cadillac", джип: "jeep", лексус: "lexus", бентли: "bentley",
  ровер: "rover", хонда: "honda", тойота: "toyota", ауди: "audi", форд: "ford",
};

const TR = {
  а: ["a"], б: ["b"], в: ["v", "w"], г: ["g"], д: ["d"], е: ["e"], ж: ["zh"], з: ["z"],
  и: ["i"], й: ["y", "i"], к: ["k", "c"], л: ["l"], м: ["m"], н: ["n"], о: ["o"], п: ["p"],
  р: ["r"], с: ["s", "c"], т: ["t"], у: ["u"], ф: ["f"], х: ["h", "x", "kh"], ц: ["ts", "c"],
  ч: ["ch"], ш: ["sh"], щ: ["sch"], ы: ["y", "i"], э: ["e"], ю: ["yu", "u"], я: ["ya"],
  ъ: [""], ь: [""],
};

// нижний регистр, ё → е, лишние пробелы
export function norm(s) {
  return String(s ?? "").toLowerCase().replace(/ё/g, "е").trim().replace(/\s+/g, " ");
}

// «фгвш» ↔ «audi»: текст, набранный не в той раскладке
export function swapLayout(s) {
  const hasCyr = /[а-яё]/i.test(s);
  if (!hasCyr && !/^[a-z[\];',.\s]+$/i.test(s)) return s;
  const map = hasCyr ? RU_TO_EN : EN_TO_RU;
  return [...s.toLowerCase()].map((c) => map.get(c) ?? c).join("");
}

// «бмв» → ["bmv", "bmw"]: фонетическая транслитерация с вариантами
export function translitVariants(s, cap = 24) {
  if (!/[а-яё]/i.test(s)) return [];
  let out = [""];
  for (const ch of s.toLowerCase()) {
    const alts = TR[ch] ?? [ch];
    const next = [];
    for (const prefix of out) for (const a of alts) next.push(prefix + a);
    out = next.slice(0, cap);
  }
  return out;
}

export function queryVariants(q) {
  const base = norm(q);
  const set = new Set([base]);
  set.add(base.split(" ").map((w) => ALIASES[w] ?? w).join(" "));
  set.add(swapLayout(base));
  for (const t of translitVariants(base)) set.add(t);
  return [...set].filter(Boolean).slice(0, 40);
}

// Расстояние Левенштейна; если оно заведомо больше max — возвращает max + 1.
export function levenshtein(a, b, max = Infinity) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (cur[j] < rowMin) rowMin = cur[j];
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

function exactMatch(v, q, ctx) {
  const name = norm(v.name);
  const hay = `${name} ${v.slug}`;
  const tokens = q.split(" ").filter(Boolean);
  if (name.includes(q) || v.slug.includes(q) || tokens.every((t) => hay.includes(t))) {
    return { score: 0, hint: ctx.categoryName(v.category) };
  }
  const tag = (v.tags || []).find((id) => ctx.tagLabel.get(id)?.includes(q));
  if (tag) return { score: 1, hint: `тег: ${ctx.tagLabel.get(tag)}` };
  const color = (v.colors || []).find(
    (c) =>
      norm(c.name).includes(q) ||
      (c.hexes ?? [c.hex]).some((h) => h?.toLowerCase().replace("#", "").includes(q))
  );
  if (color) return { score: 2, hint: `цвет: ${color.name}`, colorId: color.id };
  return null;
}

// Сумма «опечаток» по словам запроса или null, если слово не нашлось даже приблизительно.
function fuzzyDistance(v, q) {
  const words = `${norm(v.name)} ${v.slug}`.split(/[^a-z0-9а-я]+/).filter(Boolean);
  let total = 0;
  for (const t of q.split(" ").filter(Boolean)) {
    if (words.some((w) => w.includes(t))) continue;
    if (t.length < 4) return null;
    const max = t.length <= 5 ? 1 : 2;
    let best = Infinity;
    for (const w of words) {
      best = Math.min(best, levenshtein(t, w, max), levenshtein(t, w.slice(0, t.length), max));
    }
    if (best > max) return null;
    total += best;
  }
  return total;
}

// → { results: [{ v, score, hint, colorId? }], used, fuzzy }
//   used  — вариант запроса, по которому реально нашли (например «bmw» для «бмв»)
//   fuzzy — точных совпадений нет, показаны похожие («возможно, вы искали…»)
export function searchCatalog(vehicles, tags, query, { categoryName = () => "" } = {}) {
  const q = norm(query).replace(/^#/, "");
  if (!q) return { results: [], used: "", fuzzy: false };

  const ctx = {
    categoryName,
    tagLabel: new Map((tags || []).map((t) => [t.id, norm(t.label)])),
  };
  const variants = queryVariants(q);

  for (const variant of variants) {
    const out = [];
    for (const v of vehicles) {
      const m = exactMatch(v, variant, ctx);
      if (m) out.push({ v, ...m });
    }
    if (out.length > 0) {
      out.sort((a, b) => a.score - b.score);
      return { results: out.slice(0, 8), used: variant, fuzzy: false };
    }
  }

  for (const variant of variants.slice(0, 8)) {
    const out = [];
    for (const v of vehicles) {
      const d = fuzzyDistance(v, variant);
      if (d !== null) out.push({ v, score: 3 + d, hint: "похоже на запрос" });
    }
    if (out.length > 0) {
      out.sort((a, b) => a.score - b.score);
      return { results: out.slice(0, 8), used: variant, fuzzy: true };
    }
  }

  return { results: [], used: q, fuzzy: false };
}
