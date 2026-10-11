// Откат записи журнала изменений (audit_log): по строке журнала строит
// запрос к api/admin-db.js, который возвращает данные в состояние «было».
// Чистая функция без сети — проверяется тестами. Возвращает null, если
// эту запись откатить нельзя.
//
// Что умеем:
//   удаление            → восстановить запись (upsert; у credit_entries — insert,
//                         потому что id выдаёт база и в admin-db не передаётся)
//   правка / сохранение → вернуть старые значения тех полей, которые были
//                         затронуты (остальные поля не трогаем)
//   создание            → удалить созданную запись

const CLIENT_KEY_TABLES = new Set(["vehicles", "tags", "tag_groups", "credit_groups"]);
const ROLLBACK_TABLES = new Set([...CLIENT_KEY_TABLES, "credit_entries", "reports"]);

function hasKey(v) {
  return v !== null && v !== undefined && v !== "";
}

export function planRollback(row) {
  if (!row || !ROLLBACK_TABLES.has(row.table_name)) return null;
  const { table_name: table, action, old_data: oldData, new_data: newData, row_key: rowKey } = row;
  const label = `${table} · ${hasKey(rowKey) ? rowKey : "?"}`;

  if (action === "delete") {
    if (!oldData || table === "reports") return null;
    return {
      table,
      action: CLIENT_KEY_TABLES.has(table) ? "upsert" : "insert",
      params: { rows: [oldData] },
      confirm: `Восстановить удалённую запись ${label}?`,
    };
  }

  if (action === "update" || action === "upsert" || action === "insert") {
    if (oldData) {
      if (!hasKey(rowKey)) return null;
      // откатываем только поля, которые менялись (в new_data лежит то, что записали)
      const touched = newData ? Object.keys(newData).filter((k) => k !== "edited_by") : Object.keys(oldData);
      const patch = {};
      for (const k of touched) {
        if (k in oldData) patch[k] = oldData[k];
      }
      if (Object.keys(patch).length === 0) return null;
      return {
        table,
        action: "update",
        params: { keyValue: rowKey, patch },
        confirm: `Вернуть прежние значения записи ${label}? Если её правили после этого изменения, те правки тоже будут перезаписаны.`,
      };
    }
    // старых данных нет — это было создание
    if (table === "reports" || !hasKey(rowKey)) return null;
    return {
      table,
      action: "delete",
      params: { keyValue: rowKey },
      confirm: `Отменить создание: удалить запись ${label}?`,
    };
  }

  return null;
}
