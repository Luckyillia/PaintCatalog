import test from "node:test";
import assert from "node:assert/strict";
import { planRollback } from "../src/lib/auditRollback.js";

const vehicleOld = { slug: "a", name: "Старое имя", image: "/a.jpg", colors: [], edited_by: "Вася", created_at: "2026-01-01" };

test("правка: откатываются только затронутые поля", () => {
  const plan = planRollback({
    table_name: "vehicles",
    action: "update",
    row_key: "a",
    old_data: vehicleOld,
    new_data: { name: "Новое имя", edited_by: "Illia" },
  });
  assert.equal(plan.table, "vehicles");
  assert.equal(plan.action, "update");
  assert.deepEqual(plan.params, { keyValue: "a", patch: { name: "Старое имя" } });
  assert.match(plan.confirm, /vehicles · a/);
});

test("сохранение существующей записи (upsert со старыми данными) = update затронутых полей", () => {
  const plan = planRollback({
    table_name: "vehicles",
    action: "upsert",
    row_key: "a",
    old_data: vehicleOld,
    new_data: { slug: "a", name: "Новое", image: "/b.jpg", colors: [{ id: "x" }], edited_by: "Illia" },
  });
  assert.equal(plan.action, "update");
  assert.deepEqual(Object.keys(plan.params.patch).sort(), ["colors", "image", "name", "slug"]);
  assert.equal(plan.params.patch.name, "Старое имя");
  assert.equal(plan.params.patch.image, "/a.jpg");
});

test("создание (старых данных нет) откатывается удалением", () => {
  for (const action of ["insert", "upsert"]) {
    const plan = planRollback({ table_name: "tags", action, row_key: "brand-bmw", old_data: null, new_data: { id: "brand-bmw" } });
    assert.equal(plan.action, "delete");
    assert.deepEqual(plan.params, { keyValue: "brand-bmw" });
  }
});

test("удаление: у таблиц с ключом от клиента — upsert, у credit_entries — insert", () => {
  const tag = planRollback({ table_name: "tags", action: "delete", row_key: "t", old_data: { id: "t", label: "T" }, new_data: null });
  assert.equal(tag.action, "upsert");
  assert.deepEqual(tag.params, { rows: [{ id: "t", label: "T" }] });

  const entry = planRollback({ table_name: "credit_entries", action: "delete", row_key: "7", old_data: { id: 7, name: "N" }, new_data: null });
  assert.equal(entry.action, "insert");
});

test("то, что откатить нельзя, даёт null", () => {
  assert.equal(planRollback(null), null);
  assert.equal(planRollback({ table_name: "audit_log", action: "update", row_key: "1", old_data: {}, new_data: {} }), null);
  assert.equal(planRollback({ table_name: "vehicles", action: "delete", row_key: "a", old_data: null, new_data: null }), null);
  assert.equal(planRollback({ table_name: "vehicles", action: "update", row_key: "", old_data: vehicleOld, new_data: { name: "x" } }), null);
  assert.equal(planRollback({ table_name: "vehicles", action: "update", row_key: "a", old_data: vehicleOld, new_data: { edited_by: "x" } }), null);
  assert.equal(planRollback({ table_name: "reports", action: "delete", row_key: "1", old_data: { id: 1 }, new_data: null }), null);
  assert.equal(planRollback({ table_name: "vehicles", action: "rollback", row_key: "a", old_data: vehicleOld, new_data: {} }), null);
});

test("репорт: смену статуса откатить можно", () => {
  const plan = planRollback({ table_name: "reports", action: "update", row_key: "5", old_data: { id: 5, status: "new" }, new_data: { status: "accepted", edited_by: "Illia" } });
  assert.deepEqual(plan.params, { keyValue: "5", patch: { status: "new" } });
});
