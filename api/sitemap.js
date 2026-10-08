import { supabase, parseJson } from "./_lib/db.js";

// /sitemap.xml (см. rewrites в vercel.json)
export default async function handler(req, res) {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const site = (process.env.VITE_SITE_URL || `https://${host}`).replace(/\/+$/, "");

  const r = await supabase("vehicles?select=slug,category,edited_at,created_at&order=name.asc", { method: "GET" }, { anon: true });
  const rows = r.status < 400 ? parseJson(r.text) || [] : [];

  const urls = [{ loc: `${site}/` }, { loc: `${site}/credits` }, { loc: `${site}/color-search` }];
  for (const cat of new Set(rows.map((v) => v.category).filter(Boolean))) {
    urls.push({ loc: `${site}/category/${encodeURIComponent(cat)}` });
  }
  for (const v of rows) {
    const last = v.edited_at || v.created_at;
    urls.push({
      loc: `${site}/vehicle/${encodeURIComponent(v.slug)}`,
      lastmod: last ? new Date(last).toISOString().slice(0, 10) : undefined,
    });
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`)
      .join("\n") +
    `\n</urlset>\n`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.status(200).send(xml);
}
