import { supabase, parseJson } from "./_lib/db.js";

// Счётчик популярности: POST { kind: "vehicle", slug } или
// { kind: "color", slug, colorId }. Проверяет, что машина/цвет существуют,
// и увеличивает счётчик через SQL-функцию track_hit (sql/popular.sql).

const SLUG = /^[a-z0-9][a-z0-9-]{0,79}$/;
const COLOR_ID = /^[\w.-]{1,80}$/;

// Грубый ограничитель на один инстанс — защита от случайного спама.
const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 60;
const hits = new Map();

function clientIp(req) {
  const fwd = String(req.headers?.["x-forwarded-for"] || "").split(",")[0].trim();
  return fwd || req.socket?.remoteAddress || "unknown";
}

function limited(ip) {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || rec.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  rec.count += 1;
  return rec.count > MAX_PER_WINDOW;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (limited(clientIp(req))) {
    res.status(429).json({ error: "Слишком часто" });
    return;
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const slug = typeof body.slug === "string" ? body.slug : "";
  if (!SLUG.test(slug) || (body.kind !== "vehicle" && body.kind !== "color")) {
    res.status(400).json({ error: "Некорректный запрос" });
    return;
  }
  const colorId = body.kind === "color" ? (typeof body.colorId === "string" ? body.colorId : "") : "";
  if (body.kind === "color" && !COLOR_ID.test(colorId)) {
    res.status(400).json({ error: "Некорректный цвет" });
    return;
  }

  const r = await supabase(`vehicles?slug=eq.${encodeURIComponent(slug)}&select=slug,colors&limit=1`, { method: "GET" }, { anon: true });
  const vehicle = r.status < 400 ? parseJson(r.text)?.[0] : null;
  if (!vehicle || (body.kind === "color" && !(vehicle.colors || []).some((c) => c.id === colorId))) {
    res.status(404).json({ error: "Не найдено" });
    return;
  }

  const key = body.kind === "color" ? `${slug}:${colorId}` : slug;
  const saved = await supabase("rpc/track_hit", {
    method: "POST",
    body: JSON.stringify({ p_kind: body.kind, p_key: key }),
  });
  if (saved.status >= 400) {
    console.error("[track]", saved.status, saved.text.slice(0, 200));
    res.status(502).json({ error: "Не удалось записать" });
    return;
  }
  res.status(200).json({ ok: true });
}
