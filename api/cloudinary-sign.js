import crypto from "node:crypto";

// Serverless-функция Vercel: единственное место, где известен
// CLOUDINARY_API_SECRET. Браузер (конструктор) присылает сюда
// category/slug/name, функция сама строит путь и подписывает параметры —
// секрет никогда не покидает сервер.

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "";
const API_KEY = process.env.CLOUDINARY_API_KEY || "";
const API_SECRET = process.env.CLOUDINARY_API_SECRET || "";
const BASE_FOLDER = (process.env.CLOUDINARY_FOLDER || "osnova").replace(/^\/+|\/+$/g, "");

function signParams(params) {
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return crypto.createHash("sha1").update(sorted + API_SECRET).digest("hex");
}

// Разрешаем только безопасные символы в сегментах пути — то, что придёт
// от клиента (category/slug/name), не должно позволить вылезти за
// пределы своей папки (../ и т.п.) или сломать путь Cloudinary.
function sanitizeSegment(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    res.status(500).json({
      error:
        "Cloudinary не настроен на сервере: задай CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET в переменных окружения проекта на Vercel.",
    });
    return;
  }

  const body = req.body || {};
  const category = sanitizeSegment(body.category) || "misc";
  const slug = sanitizeSegment(body.slug) || "unknown";
  const name = sanitizeSegment(body.name) || "file";

  const folder = `${BASE_FOLDER}/vehicles/${category}/${slug}`;
  const publicId = name;
  const timestamp = Math.floor(Date.now() / 1000);

  const signature = signParams({
    folder,
    public_id: publicId,
    overwrite: "true",
    invalidate: "true",
    timestamp: String(timestamp),
  });

  res.status(200).json({
    cloudName: CLOUD_NAME,
    apiKey: API_KEY,
    timestamp,
    signature,
    folder,
    publicId,
  });
}