import test from "node:test";
import assert from "node:assert/strict";
import { validateFields } from "../api/_lib/validate.js";

const goodColor = { id: "white", name: "Белый", hex: "#FFFFFF" };
const goodVehicle = {
  slug: "bmw-m5-f90",
  category: "legkovoy",
  name: "BMW M5 F90",
  tags: ["brand-bmw"],
  image: "https://res.cloudinary.com/x/image/upload/a.jpg",
  colors: [goodColor],
};

test("корректная машина проходит", () => {
  assert.equal(validateFields("vehicles", goodVehicle), null);
});

test("неизвестная таблица отклоняется", () => {
  assert.equal(validateFields("users", {}), "Неизвестная таблица");
  assert.equal(validateFields("constructor", {}), "Неизвестная таблица");
});

test("частичный патч проверяет только присланные поля", () => {
  assert.equal(validateFields("vehicles", { name: "Новое имя" }), null);
  assert.match(validateFields("vehicles", { name: "" }), /name/);
});

test("slug: только латиница, цифры и дефис", () => {
  for (const bad of ["BMW", "-bmw", "bmw m5", "bmw/m5", "", "a".repeat(81)]) {
    assert.match(validateFields("vehicles", { slug: bad }), /slug/, bad);
  }
});

test("image: javascript: и data: не проходят, путь от корня и https — да", () => {
  assert.match(validateFields("vehicles", { image: "javascript:alert(1)" }), /image/);
  assert.match(validateFields("vehicles", { image: "data:text/html,x" }), /image/);
  assert.equal(validateFields("vehicles", { image: "/images/a.jpg" }), null);
  assert.equal(validateFields("vehicles", { image: "" }), null);
});

test("colors: неверный hex, дубли id, не тот формат hexes", () => {
  const bad = (colors) => validateFields("vehicles", { colors });
  assert.match(bad([{ ...goodColor, hex: "#FFF" }]), /colors/);
  assert.match(bad([goodColor, goodColor]), /colors/);
  assert.match(bad([{ id: "x", name: "X", hexes: ["#000000"] }]), /colors/);
  assert.match(bad([{ ...goodColor, accentHex: "red" }]), /colors/);
  assert.match(bad([{ ...goodColor, name: "" }]), /colors/);
  assert.match(bad("nope"), /colors/);
  assert.equal(bad([{ id: "two", name: "Две", hexes: ["#000000", "#FFFFFF"] }]), null);
  assert.equal(bad([{ ...goodColor, accentHex: "#FF0000" }]), null);
});

test("tags и tag_groups", () => {
  assert.equal(validateFields("tags", { id: "brand-bmw", label: "BMW", group_id: "brand", color: "#39C98F", sort_order: 3 }), null);
  assert.match(validateFields("tags", { color: "green" }), /color/);
  assert.match(validateFields("tags", { sort_order: 1.5 }), /sort_order/);
  assert.match(validateFields("tag_groups", { label: "" }), /label/);
});

test("credit_entries: ссылки только http(s), vehicle_slugs — массив slug", () => {
  assert.equal(validateFields("credit_entries", { link: "https://vk.ru/x", avatar: null, vehicle_slugs: ["a-b"] }), null);
  assert.match(validateFields("credit_entries", { link: "javascript:alert(1)" }), /link/);
  assert.match(validateFields("credit_entries", { avatar: "/images/a.png" }), /avatar/);
  assert.match(validateFields("credit_entries", { vehicle_slugs: ["Bad Slug"] }), /vehicle_slugs/);
  assert.match(validateFields("credit_entries", { note: "x".repeat(501) }), /note/);
});

test("reports: админ может менять только допустимый статус", () => {
  assert.equal(validateFields("reports", { status: "accepted" }), null);
  assert.equal(validateFields("reports", { status: "new" }), null);
  assert.match(validateFields("reports", { status: "deleted" }), /status/);
});
