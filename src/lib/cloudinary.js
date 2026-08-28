// Тот же принцип, что был в src/constructor/constructor-source.html:
// секретный ключ Cloudinary никогда не попадает в браузер — подпись
// выдаёт serverless-функция api/cloudinary-sign.js, а сюда загружается
// уже готовый (обрезанный) Blob.

export async function getSignedUploadParams(category, slug, name) {
  const res = await fetch(`/api/cloudinary-sign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, slug, name }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Подпись Cloudinary: ${res.status} ${text.slice(0, 200)}`);
  }
  return res.json();
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
