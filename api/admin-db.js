import { requireAdmin } from "./_lib/auth.js";
import { supabase, parseJson } from "./_lib/db.js";
import { validateFields } from "./_lib/validate.js";

// Единственная точка записи в Supabase. Браузер присылает токен админа, а
// запись выполняется здесь ключом service_role. RLS закрывает запись для
// anon-ключа. edited_by ставится на сервере из токена. Каждая успешная
// запись попадает в audit_log (если таблица создана — sql/audit-log.sql).

const TABLES = {
  vehicles: { key: "slug", columns: ["slug", "category", "name", "tags", "image", "colors"] },
  tags: { key: "id", columns: ["id", "label", "group_id", "color", "sort_order"] },
  tag_groups: { key: "id", columns: ["id", "label", "sort_order"] },
  credit_groups: { key: "id", columns: ["id", "title", "sort_order"] },
  credit_entries: {
    key: "id",
    columns: ["group_id", "name", "role", "note", "avatar", "link", "provider_id", "vehicle_slugs", "sort_order"],
  },
};

const MAX_ROWS = 50;

// Object.hasOwn: имена вроде "constructor" / "__proto__" не проходят
function getTable(name) {
  return typeof name === "string" && Object.hasOwn(TABLES, name) ? TABLES[name] : null;
}

function pick(obj, columns) {
  const out = {};
  for (const col of columns) {
    if (obj[col] !== undefined) out[col] = obj[col];
  }
  return out;
}

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

async function fetchOld(tableName, keyCol, keyValue) {
  const r = await supabase(`${tableName}?${keyCol}=eq.${encodeURIComponent(keyValue)}&select=*&limit=1`, {
    method: "GET",
  });
  if (r.status >= 400) return null;
  const rows = parseJson(r.text);
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

async function logAudit(entries) {
  if (entries.length === 0) return;
  // журнал вторичен: его сбой не должен ронять основную запись
  await supabase("audit_log", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(entries),
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const admin = requireAdmin(req, res);
  if (!admin) return;

  const body = isPlainObject(req.body) ? req.body : {};
  const table = getTable(body.table);
  if (!table) {
    res.status(400).json({ error: "Неизвестная таблица" });
    return;
  }

  const tableName = body.table;
  const action = body.action;
  const keyIsClientSupplied = table.columns.includes(table.key);
  const audit = [];
  let result;

  if (action === "insert" || action === "upsert") {
    const rows = body.rows;
    if (!Array.isArray(rows) || rows.length === 0 || rows.length > MAX_ROWS) {
      res.status(400).json({ error: `rows: от 1 до ${MAX_ROWS} записей` });
      return;
    }
    const clean = [];
    for (const row of rows) {
      if (!isPlainObject(row)) {
        res.status(400).json({ error: "Некорректная запись" });
        return;
      }
      const picked = pick(row, table.columns);
      if (keyIsClientSupplied && !picked[table.key]) {
        res.status(400).json({ error: `Не указано поле ${table.key}` });
        return;
      }
      const invalid = validateFields(tableName, picked);
      if (invalid) {
        res.status(400).json({ error: invalid });
        return;
      }
      picked.edited_by = admin.name;
      clean.push(picked);
    }

    const isUpsert = action === "upsert";
    const oldRow =
      isUpsert && clean.length === 1 && keyIsClientSupplied
        ? await fetchOld(tableName, table.key, clean[0][table.key])
        : null;

    const query = isUpsert ? `${tableName}?on_conflict=${table.key}` : tableName;
    result = await supabase(query, {
      method: "POST",
      headers: {
        Prefer: isUpsert ? "resolution=merge-duplicates,return=representation" : "return=representation",
      },
      body: JSON.stringify(clean),
    });

    if (result.status < 400) {
      const returned = parseJson(result.text);
      clean.forEach((row, i) => {
        audit.push({
          table_name: tableName,
          row_key: String(row[table.key] ?? returned?.[i]?.[table.key] ?? ""),
          action,
          edited_by: admin.name,
          old_data: oldRow,
          new_data: row,
        });
      });
    }
  } else if (action === "update" || action === "delete") {
    const keyValue = body.keyValue;
    if ((typeof keyValue !== "string" && typeof keyValue !== "number") || keyValue === "") {
      res.status(400).json({ error: "Не указан ключ записи" });
      return;
    }
    const filter = `${tableName}?${table.key}=eq.${encodeURIComponent(keyValue)}`;
    const oldRow = await fetchOld(tableName, table.key, keyValue);

    if (action === "update") {
      if (!isPlainObject(body.patch)) {
        res.status(400).json({ error: "Не указан patch" });
        return;
      }
      const patch = pick(body.patch, table.columns);
      delete patch[table.key]; // ключ записи менять нельзя
      const invalid = validateFields(tableName, patch);
      if (invalid) {
        res.status(400).json({ error: invalid });
        return;
      }
      patch.edited_by = admin.name;
      result = await supabase(filter, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(patch),
      });
      if (result.status < 400) {
        audit.push({
          table_name: tableName,
          row_key: String(keyValue),
          action,
          edited_by: admin.name,
          old_data: oldRow,
          new_data: patch,
        });
      }
    } else {
      result = await supabase(filter, { method: "DELETE", headers: { Prefer: "return=minimal" } });
      if (result.status < 400) {
        audit.push({
          table_name: tableName,
          row_key: String(keyValue),
          action,
          edited_by: admin.name,
          old_data: oldRow,
          new_data: null,
        });
      }
    }
  } else {
    res.status(400).json({ error: "Неизвестное действие" });
    return;
  }

  if (result.status >= 400) {
    const code = result.status >= 500 ? 502 : 400;
    res.status(code).json({ error: `Supabase ${result.status}: ${result.text.slice(0, 300)}` });
    return;
  }

  await logAudit(audit);
  res.status(200).json({ data: parseJson(result.text) });
}
