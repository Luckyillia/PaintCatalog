import { supabase, parseJson } from "./_lib/db.js";
import { validateReport, hashIp, exceedsLimits, GLOBAL_PER_HOUR } from "./_lib/reports.js";

// Публичная форма: «Ошибка в цвете» и «Предложить машину».
// Пишет в таблицу reports ключом service_role (anon-ключу запись закрыта —
// см. sql/reports.sql). Защита от спама: ловушка-поле, минимальное время
// заполнения, проверка, что машина/цвет существуют, лимиты по хэшу IP
// (считаются по самой таблице, поэтому работают между инстансами serverless).

function clientIp(req) {
  const fwd = String(req.headers?.["x-forwarded-for"] || "").split(",")[0].trim();
  return fwd || req.socket?.remoteAddress || "unknown";
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const result = validateReport(req.body);
  if (result.spam) {
    // боту не сообщаем, что его распознали
    res.status(200).json({ ok: true });
    return;
  }
  if (result.error) {
    res.status(400).json({ error: result.error });
    return;
  }
  const row = result.row;

  const salt = process.env.REPORT_IP_SALT || process.env.ADMIN_SESSION_SECRET || "osnova";
  const ipHash = hashIp(clientIp(req), salt);

  const dayAgo = encodeURIComponent(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  const hourAgo = encodeURIComponent(new Date(Date.now() - 60 * 60 * 1000).toISOString());

  const [mine, all] = await Promise.all([
    supabase(`reports?select=created_at&ip_hash=eq.${ipHash}&created_at=gte.${dayAgo}&order=created_at.desc&limit=50`, {
      method: "GET",
    }),
    supabase(`reports?select=id&created_at=gte.${hourAgo}&limit=${GLOBAL_PER_HOUR + 1}`, { method: "GET" }),
  ]);
  if (mine.status >= 400 || all.status >= 400) {
    res.status(502).json({ error: "Не удалось отправить, попробуй чуть позже." });
    return;
  }

  const hit = exceedsLimits((parseJson(mine.text) || []).map((r) => r.created_at));
  if (hit) {
    res.status(429).json({
      error:
        hit === "hour"
          ? "Слишком много сообщений за последний час. Попробуй позже."
          : "Достигнут дневной лимит сообщений. Попробуй завтра.",
    });
    return;
  }
  if ((parseJson(all.text) || []).length > GLOBAL_PER_HOUR) {
    res.status(429).json({ error: "Сейчас слишком много сообщений. Попробуй позже." });
    return;
  }

  if (row.kind === "color_error") {
    const r = await supabase(
      `vehicles?slug=eq.${encodeURIComponent(row.vehicle_slug)}&select=slug,colors&limit=1`,
      { method: "GET" },
      { anon: true }
    );
    const vehicle = r.status < 400 ? parseJson(r.text)?.[0] : null;
    if (!vehicle) {
      res.status(400).json({ error: "Такой машины нет в каталоге." });
      return;
    }
    if (row.color_id && !(Array.isArray(vehicle.colors) && vehicle.colors.some((c) => c.id === row.color_id))) {
      res.status(400).json({ error: "У этой машины нет такого цвета." });
      return;
    }
  }

  const saved = await supabase("reports", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ ...row, ip_hash: ipHash }),
  });
  if (saved.status >= 400) {
    res.status(502).json({ error: "Не удалось отправить, попробуй чуть позже." });
    return;
  }

  res.status(200).json({ ok: true });
}
