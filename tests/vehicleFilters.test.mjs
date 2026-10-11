import test from "node:test";
import assert from "node:assert/strict";
import { filterByFamily, sortVehicles, vehicleFamilies } from "../src/lib/vehicleFilters.js";

const a = { name: "Б", slug: "b", createdAt: "2026-01-01", colors: [{ hex: "#FF0000" }] };
const b = { name: "А", slug: "a", createdAt: "2026-03-01", colors: [{ hex: "#00FF00" }, { hex: "#0000FF" }, { hex: "#FFFFFF" }] };
const c = { name: "В", slug: "c", createdAt: "", colors: [{ hexes: ["#000000", "#111111"] }] };

test("сортировка", () => {
  assert.deepEqual(sortVehicles([a, b, c], "name").map((v) => v.slug), ["a", "b", "c"]);
  assert.deepEqual(sortVehicles([a, b, c], "new").map((v) => v.slug), ["a", "b", "c"]);
  assert.deepEqual(sortVehicles([a, b, c], "colors").map((v) => v.slug), ["a", "b", "c"]);
});

test("семейства и фильтр", () => {
  assert.deepEqual([...vehicleFamilies(b)].sort(), ["blue", "green", "white"]);
  assert.deepEqual(filterByFamily([a, b, c], "red").map((v) => v.slug), ["b"]);
  assert.equal(filterByFamily([a, b, c], "").length, 3);
  assert.deepEqual(filterByFamily([a, b, c], "black").map((v) => v.slug), ["c"]);
});
