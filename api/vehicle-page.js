import { supabase, parseJson } from "./_lib/db.js";

// /vehicle/:slug отдаёт обычный index.html, но с OG-тегами конкретной
// машины — чтобы ссылка красиво выглядела в Telegram/VK/Discord.
// Сам сайт (SPA) работает как раньше. Если что-то пошло не так —
// удали правило /vehicle/:slug из vercel.json, и всё вернётся как было.

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function ogImage(url) {
  const marker = "/image/upload/";
  if (typeof url !== "string" || !url.includes("res.cloudinary.com") || !url.includes(marker)) return url || "";
  const i = url.indexOf(marker) + marker.length;
  return `${url.slice(0, i)}f_jpg,q_auto,c_fill,w_1200,h_630/${url.slice(i)}`;
}

function setMeta(html, property, value) {
  const re = new RegExp(`(<meta\\s+(?:property|name)="${property}"\\s+content=")[^"]*(")`);
  return re.test(html)
    ? html.replace(re, (_m, a, b) => `${a}${esc(value)}${b}`)
    : html.replace("</head>", () => `<meta property="${property}" content="${esc(value)}" />\n</head>`);
}

export default async function handler(req, res) {
  const slug = String(req.query?.slug ?? new URL(req.url, "http://x").searchParams.get("slug") ?? "").trim();
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const origin = `${proto}://${host}`;

  let html;
  try {
    const r = await fetch(`${origin}/index.html`);
    if (!r.ok) throw new Error(`index.html: ${r.status}`);
    html = await r.text();
  } catch (err) {
    res.status(502).send(`Не удалось загрузить страницу: ${err.message}`);
    return;
  }

  if (slug && /^[a-z0-9-]{1,80}$/.test(slug)) {
    const r = await supabase(`vehicles?slug=eq.${encodeURIComponent(slug)}&select=name,image,colors&limit=1`, { method: "GET" }, { anon: true });
    const v = r.status < 400 ? parseJson(r.text)?.[0] : null;
    if (v) {
      const n = Array.isArray(v.colors) ? v.colors.length : 0;
      const title = `${v.name} — стоковые цвета | OSNOVA`;
      const desc = `Заводские цвета ${v.name}: ${n} вариантов окраски с точными hex-кодами.`;
      html = html.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${esc(title)}</title>`);
      html = setMeta(html, "description", desc);
      html = setMeta(html, "og:title", title);
      html = setMeta(html, "og:description", desc);
      html = setMeta(html, "og:url", `${origin}/vehicle/${slug}`);
      const img = ogImage(v.image);
      if (img) html = setMeta(html, "og:image", img);
    }
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  res.status(200).send(html);
}
