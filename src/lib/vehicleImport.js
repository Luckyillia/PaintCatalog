import { sanitizeSlug, normalizeHex, isValidHex } from "./textUtils.js";

// Массовый импорт машин из JSON или CSV. Чистая логика: разбор и проверка
// без сети (запись делает страница админки через adminSaveVehicle).

export const CSV_TEMPLATE =
  "slug;category;name;tags;image;color_id;color_name;hex;hex2;accent;color_image\n" +
  "bmw-m5-f90;legkovoy;BMW M5 F90;brand-bmw|era-2010s;;white;Белый;#FFFFFF;;;\n" +
  "bmw-m5-f90;legkovoy;BMW M5 F90;;;black;Чёрный;#111111;#222222;#FF0000;\n";

// Разбор CSV: разделитель (; , или таб) определяется по первой строке,
// поддерживаются кавычки и "" внутри них.
export function parseCsv(text) {
  const src = String(text || "").replace(/^\uFEFF/, "");
  const first = src.split(/\r?\n/, 1)[0] || "";
  const counts = { ";": 0, ",": 0, "\t": 0 };
  for (const ch of first) if (ch in counts) counts[ch] += 1;
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const delim = top[1] > 0 ? top[0] : ",";

  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

function csvToRaws(text) {
  const rows = parseCsv(text);
  if (rows.length < 2) return { raws: [], errors: ["CSV: нужна строка заголовков и хотя бы одна строка данных."] };
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const col = (name) => head.indexOf(name);
  for (const need of ["category", "color_name", "hex"]) {
    if (col(need) === -1) return { raws: [], errors: [`CSV: нет колонки «${need}».`] };
  }
  if (col("name") === -1 && col("slug") === -1) return { raws: [], errors: ["CSV: нужна колонка «name» или «slug»."] };

  const get = (r, name) => (col(name) === -1 ? "" : String(r[col(name)] ?? "").trim());
  const map = new Map();
  for (const r of rows.slice(1)) {
    const key = get(r, "slug") || sanitizeSlug(get(r, "name"), "");
    if (!key) continue;
    if (!map.has(key)) {
      map.set(key, {
        slug: get(r, "slug"),
        category: get(r, "category"),
        name: get(r, "name"),
        tags: get(r, "tags"),
        image: get(r, "image"),
        colors: [],
      });
    }
    const v = map.get(key);
    if (!v.tags && get(r, "tags")) v.tags = get(r, "tags");
    if (!v.image && get(r, "image")) v.image = get(r, "image");
    v.colors.push({
      id: get(r, "color_id"),
      name: get(r, "color_name"),
      hex: get(r, "hex"),
      hex2: get(r, "hex2"),
      accentHex: get(r, "accent"),
      image: get(r, "color_image"),
    });
  }
  return { raws: [...map.values()], errors: [] };
}

const URL_RE = /^(https?:\/\/|\/)/i;

function normalizeVehicle(raw, idx, categorySlugs) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { errors: [`Запись ${idx + 1}: это не объект.`] };
  const errors = [];
  const name = String(raw.name ?? "").trim().replace(/\s+/g, " ");
  if (!name || name.length > 120) errors.push("нет названия (до 120 символов)");
  const slug = sanitizeSlug(raw.slug || name, "");
  if (!slug || slug.length > 80) errors.push("не получился slug");
  const category = String(raw.category ?? "").trim();
  if (!categorySlugs.includes(category)) errors.push(`категория «${category}» не из списка (${categorySlugs.join(", ")})`);

  const tagsRaw = Array.isArray(raw.tags) ? raw.tags : String(raw.tags ?? "").split(/[|,;]/);
  const tags = [...new Set(tagsRaw.map((t) => String(t).trim()).filter((t) => t.length >= 1 && t.length <= 80))];

  const image = String(raw.image ?? "").trim();
  if (image && !URL_RE.test(image)) errors.push("обложка: нужна ссылка http(s) или путь от корня сайта");

  const colors = [];
  const rawColors = Array.isArray(raw.colors) ? raw.colors : [];
  if (rawColors.length === 0 || rawColors.length > 80) errors.push("цветов должно быть от 1 до 80");
  const ids = new Set();
  rawColors.forEach((c, i) => {
    const where = `цвет ${i + 1}`;
    if (!c || typeof c !== "object") return errors.push(`${where}: не объект`);
    const cname = String(c.name ?? "").trim();
    if (!cname || cname.length > 80) return errors.push(`${where}: нет названия (до 80 символов)`);
    const id = sanitizeSlug(c.id || cname, "color");
    if (id.length > 60) return errors.push(`${where} «${cname}»: слишком длинный id`);
    if (id === "main") return errors.push(`${where} «${cname}»: id «main» зарезервирован под обложку`);
    if (ids.has(id)) return errors.push(`${where} «${cname}»: id «${id}» повторяется`);
    ids.add(id);

    const list = Array.isArray(c.hexes) ? c.hexes : [c.hex, c.hex2].filter((h) => h != null && String(h).trim() !== "");
    const hexes = list.map((h) => normalizeHex(String(h)));
    if (hexes.length < 1 || hexes.length > 2 || !hexes.every(isValidHex)) {
      return errors.push(`${where} «${cname}»: hex должен быть вида #RRGGBB (один или два)`);
    }
    const accentRaw = c.accentHex ?? c.accent;
    const accent = accentRaw ? normalizeHex(String(accentRaw)) : "";
    if (accent && !isValidHex(accent)) return errors.push(`${where} «${cname}»: цвет вставок должен быть вида #RRGGBB`);
    const cimage = String(c.image ?? "").trim();
    if (cimage && !URL_RE.test(cimage)) return errors.push(`${where} «${cname}»: фото — ссылка http(s) или путь от корня`);

    const out = { id, name: cname, image: cimage };
    if (hexes.length === 2) out.hexes = hexes;
    else out.hex = hexes[0];
    if (accent) out.accentHex = accent;
    colors.push(out);
  });

  if (errors.length > 0) return { errors: errors.map((e) => `«${name || slug || idx + 1}»: ${e}`) };
  return { vehicle: { slug, category, name, tags, image, colors }, errors: [] };
}

// → { vehicles: [корректные], errors: [строки] }
export function parseImport(text, categorySlugs) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return { vehicles: [], errors: [] };

  let raws;
  const errors = [];
  if (/^[[{]/.test(trimmed)) {
    try {
      const data = JSON.parse(trimmed);
      raws = Array.isArray(data) ? data : Array.isArray(data?.vehicles) ? data.vehicles : [data];
    } catch (e) {
      return { vehicles: [], errors: [`JSON не разобрался: ${e.message}`] };
    }
  } else {
    const r = csvToRaws(trimmed);
    if (r.errors.length) return { vehicles: [], errors: r.errors };
    raws = r.raws;
  }
  if (raws.length > 500) return { vehicles: [], errors: ["Слишком много машин за раз (максимум 500)."] };

  const vehicles = [];
  const seen = new Set();
  raws.forEach((raw, i) => {
    const r = normalizeVehicle(raw, i, categorySlugs);
    errors.push(...r.errors);
    if (!r.vehicle) return;
    if (seen.has(r.vehicle.slug)) {
      errors.push(`«${r.vehicle.name}»: slug «${r.vehicle.slug}» повторяется в файле`);
      return;
    }
    seen.add(r.vehicle.slug);
    vehicles.push(r.vehicle);
  });
  return { vehicles, errors };
}

// При перезаписи существующей машины пустые поля импорта не стирают то, что
// уже есть: обложку, фото цветов (по id) и теги.
export function mergeWithExisting(imported, existing) {
  const oldColors = new Map((existing?.colors || []).map((c) => [c.id, c]));
  return {
    ...imported,
    image: imported.image || existing?.image || "",
    tags: imported.tags.length > 0 ? imported.tags : existing?.tags || [],
    colors: imported.colors.map((c) => ({ ...c, image: c.image || oldColors.get(c.id)?.image || "" })),
  };
}
