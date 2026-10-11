import { supabase, parseJson } from "./_lib/db.js";

// Популярное для главной: топ машин (по открытиям) и цветов (по копированиям).
// Если таблицы hits ещё нет, отдаёт пустые списки — блок просто не показывается.

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=3600");
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const [v, c] = await Promise.all([
    supabase("hits?kind=eq.vehicle&select=key,count&order=count.desc&limit=8", { method: "GET" }),
    supabase("hits?kind=eq.color&select=key,count&order=count.desc&limit=12", { method: "GET" }),
  ]);

  const rows = (r) => (r.status < 400 ? parseJson(r.text) || [] : []);
  const vehicles = rows(v).map((r) => ({ slug: r.key, count: r.count }));
  const colors = rows(c)
    .map((r) => {
      const i = String(r.key).indexOf(":");
      return i > 0 ? { slug: r.key.slice(0, i), colorId: r.key.slice(i + 1), count: r.count } : null;
    })
    .filter(Boolean);

  res.status(200).json({ vehicles, colors });
}
