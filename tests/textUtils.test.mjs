import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeSlug, normalizeHex, isValidHex } from "../src/lib/textUtils.js";

test("sanitizeSlug транслитерирует и чистит", () => {
  assert.equal(sanitizeSlug("Привет Мир"), "privet-mir");
  assert.equal(sanitizeSlug("  BMW M5 (F90) "), "bmw-m5-f90");
  assert.equal(sanitizeSlug("!!!", "fallback"), "fallback");
});

test("normalizeHex", () => {
  assert.equal(normalizeHex("abc"), "#AABBCC");
  assert.equal(normalizeHex("ff0000"), "#FF0000");
  assert.equal(normalizeHex("#a1b2c3"), "#A1B2C3");
  assert.equal(normalizeHex(""), "");
});

test("isValidHex", () => {
  assert.equal(isValidHex("#FFFFFF"), true);
  assert.equal(isValidHex("#fff"), false);
  assert.equal(isValidHex("#zzzzzz"), false);
});
