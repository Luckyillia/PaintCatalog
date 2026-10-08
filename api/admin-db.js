import { requireAdmin } from "./_lib/auth.js";

// Единственная точка записи в Supabase. Браузер присылает токен
// админа, а запись выполняется здесь ключом service_role (он никогда
// не покидает сервер). RLS в базе закрывает запись для anon-ключа.
//
// edited_by всегда ставится на сервере из токена — подделать нельзя.

const TABLES = {
  vehicles: {
    key: "slug",
    columns: ["slug", "category", "name", "tags", "image", "colors"],
  },
  tags: {
    key: "id",
    columns: ["id", "label", "group_id", "color", "sort_order"],
  },
  tag_groups: {
    key: "id",
    columns: ["id", "label", "sort_order"],
  },
  credit_groups: {
    key: "id",
    columns: ["id", "title", "sort_order"],
  },
  credit_entries: {
    key: "id",
    columns: [
      "group_id", "name", "role", "note", "avatar", "link",
      "provider_id", "vehicle_slugs", "sort_order",
    ],
  },
};

const MAX_ROWS = 50;

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

async function supabase(pathAndQuery, init) {
  const base = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_KEY || "";
  if (!base || !key) {
    return { status: 500, text: "SUPABASE_URL / SUPABASE_SERVICE_KEY не заданы на сервере" };
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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const admin = requireAdmin(req, res);
  if (!admin) return;

  const body = isPlainObject(req.body) ? req.body : {};
  const table = TABLES[body.table];
  if (!table) {
    res.status(400).json({ error: "Неизвестная таблица" });
    return;
  }

  const action = body.action;
  const keyIsClientSupplied = table.columns.includes(table.key);
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
      picked.edited_by = admin.name;
      clean.push(picked);
    }

    const isUpsert = action === "upsert";
    const query = isUpsert ? `${body.table}?on_conflict=${table.key}` : body.table;
    result = await supabase(query, {
      method: "POST",
      headers: {
        Prefer: isUpsert
          ? "resolution=merge-duplicates,return=representation"
          : "return=representation",
      },
      body: JSON.stringify(clean),
    });
  } else if (action === "update" || action === "delete") {
    const keyValue = body.keyValue;
    if ((typeof keyValue !== "string" && typeof keyValue !== "number") || keyValue === "") {
      res.status(400).json({ error: "Не указан ключ записи" });
      return;
    }
    const filter = `${body.table}?${table.key}=eq.${encodeURIComponent(keyValue)}`;

    if (action === "update") {
      if (!isPlainObject(body.patch)) {
        res.status(400).json({ error: "Не указан patch" });
        return;
      }
      const patch = pick(body.patch, table.columns);
      delete patch[table.key]; // ключ записи менять нельзя
      patch.edited_by = admin.name;
      result = await supabase(filter, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(patch),
      });
    } else {
      result = await supabase(filter, {
        method: "DELETE",
        headers: { Prefer: "return=minimal" },
      });
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

  let data = null;
  try {
    data = result.text ? JSON.parse(result.text) : null;
  } catch {
    data = null;
  }
  res.status(200).json({ data });
}
