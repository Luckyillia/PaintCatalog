import { requireAdmin } from "./_lib/auth.js";
import { supabase, parseJson } from "./_lib/db.js";

// Очередь репортов для админки (только залогиненному админу).
// ip_hash наружу не отдаётся. Изменение статуса и удаление идут через
// api/admin-db.js (таблица reports), чтобы попадать в журнал изменений.

const COLUMNS = "id,created_at,kind,vehicle_slug,color_id,message,contact,payload,status,edited_by,edited_at";
const STATUSES = ["new", "accepted", "rejected"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const admin = requireAdmin(req, res);
  if (!admin) return;

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const status = STATUSES.includes(body.status) ? body.status : "";
  const limit = Math.min(Math.max(parseInt(body.limit, 10) || 100, 1), 300);

  const countsRes = await supabase("reports?select=status&limit=5000", { method: "GET" });
  if (countsRes.status >= 400) {
    res.status(502).json({
      error: `Supabase ${countsRes.status}: ${countsRes.text.slice(0, 200)}. Если таблицы reports ещё нет — выполни sql/reports.sql.`,
    });
    return;
  }
  const counts = { new: 0, accepted: 0, rejected: 0 };
  for (const r of parseJson(countsRes.text) || []) {
    if (r.status in counts) counts[r.status] += 1;
  }

  if (body.countOnly) {
    res.status(200).json({ counts });
    return;
  }

  const query = `reports?select=${COLUMNS}&order=created_at.desc&limit=${limit}${status ? `&status=eq.${status}` : ""}`;
  const r = await supabase(query, { method: "GET" });
  if (r.status >= 400) {
    res.status(502).json({ error: `Supabase ${r.status}: ${r.text.slice(0, 200)}` });
    return;
  }
  res.status(200).json({ data: parseJson(r.text) || [], counts });
}
