// Сравнение цветов: список из выбранных окрасок («slug:colorId») и его
// сериализация для ссылки /compare?c=slug:color,slug:color.

export const COMPARE_LIMIT = 4;

const PART = /^[\w.-]{1,80}$/;

export function sameItem(a, b) {
  return a.slug === b.slug && a.colorId === b.colorId;
}

export function encodeCompare(items) {
  return items.map((i) => `${i.slug}:${i.colorId}`).join(",");
}

// Чистит всё, что пришло из ссылки или localStorage: только корректные
// пары, без дублей, не больше COMPARE_LIMIT.
export function decodeCompare(param) {
  if (typeof param !== "string" || !param) return [];
  const out = [];
  for (const part of param.split(",")) {
    const idx = part.indexOf(":");
    if (idx <= 0) continue;
    const slug = part.slice(0, idx);
    const colorId = part.slice(idx + 1);
    if (!PART.test(slug) || !PART.test(colorId)) continue;
    const item = { slug, colorId };
    if (out.some((o) => sameItem(o, item))) continue;
    out.push(item);
    if (out.length >= COMPARE_LIMIT) break;
  }
  return out;
}
