import audit from "./_lib/admin-audit.js";
import reports from "./_lib/admin-reports.js";
import trash from "./_lib/admin-trash.js";

// Один serverless-эндпоинт вместо трёх (лимит 12 функций на Hobby).
// Тело запроса: { resource: "audit" | "reports" | "trash", ...параметры }
// Метод и проверку админа делает каждый обработчик сам.
const HANDLERS = { audit, reports, trash };

export default function handler(req, res) {
  const resource = req.body && typeof req.body === "object" ? req.body.resource : null;
  const fn = typeof resource === "string" && Object.hasOwn(HANDLERS, resource) ? HANDLERS[resource] : null;
  if (!fn) {
    res.status(400).json({ error: "Неизвестный ресурс" });
    return;
  }
  return fn(req, res);
}
