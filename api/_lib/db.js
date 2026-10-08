// Общий клиент Supabase REST для serverless-функций (файлы в api/_lib
// не становятся функциями Vercel). Никогда не бросает исключение —
// возвращает { status, text }.
export async function supabase(pathAndQuery, init = {}, { anon = false } = {}) {
  const base = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
  const key = anon
    ? process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || ""
    : process.env.SUPABASE_SERVICE_KEY || "";
  if (!base || !key) {
    return { status: 500, text: "SUPABASE_URL / ключ Supabase не заданы на сервере" };
  }
  try {
    const r = await fetch(`${base}/rest/v1/${pathAndQuery}`, {
      ...init,
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });
    return { status: r.status, text: await r.text().catch(() => "") };
  } catch (err) {
    return { status: 502, text: `не удалось связаться с Supabase: ${err?.message || err}` };
  }
}

export function parseJson(text) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}
