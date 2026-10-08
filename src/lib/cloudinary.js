// Секретный ключ Cloudinary никогда не попадает в браузер — подпись
// выдаёт serverless-функция api/cloudinary-sign.js (только залогиненному
// админу), а сюда загружается уже готовый (обрезанный) Blob.

import { adminFetch } from "./adminApi";

export async function getSignedUploadParams(category, slug, name) {
  return adminFetch("/api/cloudinary-sign", { category, slug, name });
}

export async function uploadToCloudinary(blob, category, slug, name) {
  const signed = await getSignedUploadParams(category, slug, name);

  const form = new FormData();
  form.append("file", blob);
  form.append("api_key", signed.apiKey);
  form.append("timestamp", signed.timestamp);
  form.append("signature", signed.signature);
  form.append("folder", signed.folder);
  form.append("public_id", signed.publicId);
  form.append("allowed_formats", signed.allowedFormats);
  form.append("overwrite", "true");
  form.append("invalidate", "true");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`,
    { method: "POST", body: form }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Cloudinary: ${res.status} ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  return json.secure_url;
}
