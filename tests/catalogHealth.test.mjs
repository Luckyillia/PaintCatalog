import test from "node:test";
import assert from "node:assert/strict";
import { analyzeCatalog } from "../src/lib/catalogHealth.js";

test("находит пробелы в каталоге", () => {
  const good = { slug: "g", name: "G", image: "/a.jpg", tags: ["t"], colors: [{ id: "w", name: "W", hex: "#FFFFFF", image: "/w.jpg" }] };
  const bad = {
    slug: "b", name: "B", image: "", tags: [],
    colors: [
      { id: "w", name: "Белый", hex: "#ffffff", image: "" },
      { id: "s", name: "Снег", hex: "#FFFFFF", image: "/s.jpg" },
    ],
  };
  const empty = { slug: "e", name: "E", image: "/e.jpg", tags: ["t"], colors: [] };
  const r = analyzeCatalog([good, bad, empty]);
  assert.equal(r.total, 3);
  assert.deepEqual(r.noCover.map((v) => v.slug), ["b"]);
  assert.deepEqual(r.noTags.map((v) => v.slug), ["b"]);
  assert.deepEqual(r.noColors.map((v) => v.slug), ["e"]);
  assert.deepEqual(r.colorsNoPhoto.map((x) => [x.vehicle.slug, x.count, x.total]), [["b", 1, 2]]);
  assert.deepEqual(r.duplicateHex[0].groups[0].names, ["Белый", "Снег"]);
  assert.equal(r.issues, 5);
  assert.equal(analyzeCatalog([good]).issues, 0);
});
