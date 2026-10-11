import { requireAdmin } from "./auth.js";
import { supabase, parseJson } from "./db.js";

// Корзина админки: сюда api/admin-db.js кладёт копию каждой удалённой записи.
// Восстанавливает запись браузер (через admin-db), здесь — список и очистка.
// Записи старше KEEP_DAYS удаляются сами при открытии списка.

const KEEP_DAYS = 30;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const admin = requireAdmin(req, res);
  if (!admin) return;

  const body = req.body && typeof req.body === "object" ? req.body : {};

  if (body.action === "list") {
    const cutoff = encodeURIComponent(new Date(Date.now() - KEEP_DAYS * 86400000).toISOString());
    await supabase(`trash?deleted_at=lt.${cutoff}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
    const r = await supabase("trash?select=*&order=deleted_at.desc&limit=200", { method: "GET" });
    if (r.status >= 400) {
      res.status(502).json({ error: `Supabase ${r.status}: ${r.text.slice(0, 200)}. Если таблицы trash ещё нет — выполни sql/trash.sql.` });
      return;
    }
    res.status(200).json({ data: parseJson(r.text) || [], keepDays: KEEP_DAYS });
    return;
  }

  if (body.action === "purge" || body.action === "empty") {
    const filter = body.action === "empty" ? "id=gt.0" : Number.isInteger(body.id) && body.id > 0 ? `id=eq.${body.id}` : "";
    if (!filter) {
      res.status(400).json({ error: "Не указан id" });
      return;
    }
    const r = await supabase(`trash?${filter}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
    if (r.status >= 400) {
      res.status(502).json({ error: `Supabase ${r.status}: ${r.text.slice(0, 200)}` });
      return;
    }
    res.status(200).json({ ok: true });
    return;
  }

  res.status(400).json({ error: "Неизвестное действие" });
}
