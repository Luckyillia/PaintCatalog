import crypto from "node:crypto";
import { requireAdmin } from "./_lib/auth.js";

// Serverless-функция Vercel: единственное место, где известен
// CLOUDINARY_API_SECRET. Подпись выдаётся только залогиненному админу
// (токен из /api/admin-login). Браузер присылает category/slug/name,
// функция сама строит путь и подписывает параметры — секрет никогда не
// покидает сервер. CORS не открыт: вызывается только с того же домена.

const ALLOWED_FORMATS = "jpg,jpeg,png,webp";

function signParams(params, apiSecret) {
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return crypto.createHash("sha1").update(sorted + apiSecret).digest("hex");
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
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const admin = requireAdmin(req, res);
  if (!admin) return;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
  const apiKey = process.env.CLOUDINARY_API_KEY || "";
  const apiSecret = process.env.CLOUDINARY_API_SECRET || "";
  const baseFolder = (process.env.CLOUDINARY_FOLDER || "osnova").replace(/^\/+|\/+$/g, "");

  if (!cloudName || !apiKey || !apiSecret) {
    res.status(500).json({
      error:
        "Cloudinary не настроен на сервере: задай CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET в переменных окружения проекта на Vercel.",
    });
    return;
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const category = sanitizeSegment(body.category) || "misc";
  const slug = sanitizeSegment(body.slug) || "unknown";
  const name = sanitizeSegment(body.name) || "file";

  const folder = `${baseFolder}/vehicles/${category}/${slug}`;
  const publicId = name;
  const timestamp = Math.floor(Date.now() / 1000);

  const signature = signParams(
    {
      allowed_formats: ALLOWED_FORMATS,
      folder,
      public_id: publicId,
      overwrite: "true",
      invalidate: "true",
      timestamp: String(timestamp),
    },
    apiSecret
  );

  res.status(200).json({
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder,
    publicId,
    allowedFormats: ALLOWED_FORMATS,
  });
}
