import test from "node:test";
import assert from "node:assert/strict";
import { encodeCompare, decodeCompare, COMPARE_LIMIT } from "../src/lib/compare.js";

test("encode / decode — круговой путь", () => {
  const items = [{ slug: "bmw-m5-f90", colorId: "white" }, { slug: "audi-rs6-c7", colorId: "nardo-gray" }];
  assert.equal(encodeCompare(items), "bmw-m5-f90:white,audi-rs6-c7:nardo-gray");
  assert.deepEqual(decodeCompare(encodeCompare(items)), items);
});

test("decode отбрасывает мусор, дубли и лишнее", () => {
  assert.deepEqual(decodeCompare(""), []);
  assert.deepEqual(decodeCompare(null), []);
  assert.deepEqual(decodeCompare("без-двоеточия,:пусто,a:,a:b c,<script>:x"), []);
  assert.deepEqual(decodeCompare("a:b,a:b,a:c"), [{ slug: "a", colorId: "b" }, { slug: "a", colorId: "c" }]);
  const many = Array.from({ length: 10 }, (_, i) => `v${i}:c`).join(",");
  assert.equal(decodeCompare(many).length, COMPARE_LIMIT);
});
