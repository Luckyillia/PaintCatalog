// Добавляет в Cloudinary-ссылку авто-формат/качество/ширину (f_auto,q_auto,w_N).
// Остальные ссылки возвращает как есть.
export function optimizeImage(url, width = 640) {
  if (typeof url !== "string") return url;
  const marker = "/image/upload/";
  if (!url.includes("res.cloudinary.com") || !url.includes(marker)) return url;
  const idx = url.indexOf(marker);
  const head = url.slice(0, idx + marker.length);
  const tail = url.slice(idx + marker.length);
  if (/^(f_|q_|w_|c_|h_)/.test(tail)) return url; // трансформация уже есть
  return `${head}f_auto,q_auto,c_limit,w_${width}/${tail}`;
}
