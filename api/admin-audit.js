import { requireAdmin } from "./_lib/auth.js";
import { supabase, parseJson } from "./_lib/db.js";

// Чтение журнала изменений (доступно только залогиненному админу).
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const admin = requireAdmin(req, res);
  if (!admin) return;

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const limit = Math.min(Math.max(parseInt(body.limit, 10) || 100, 1), 300);
  const table = typeof body.table === "string" && /^[a-z_]{1,40}$/.test(body.table) ? body.table : "";

  const query = `audit_log?select=*&order=created_at.desc&limit=${limit}${table ? `&table_name=eq.${table}` : ""}`;
  const r = await supabase(query, { method: "GET" });
  if (r.status >= 400) {
    res.status(502).json({ error: `Supabase ${r.status}: ${r.text.slice(0, 200)}` });
    return;
  }
  res.status(200).json({ data: parseJson(r.text) || [] });
}
