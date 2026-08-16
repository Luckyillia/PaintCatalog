#!/usr/bin/env node
// Генерирует SHA-256 хэш пароля для конструктора.
// Использование: node scripts/hash-password.mjs "мой-пароль"

import { createHash } from "node:crypto";

const password = process.argv[2];

if (!password) {
  console.error('Использование: node scripts/hash-password.mjs "мой-пароль"');
  process.exit(1);
}

const hash = createHash("sha256").update(password, "utf8").digest("hex");

console.log("\nХэш пароля:");
console.log(hash);
console.log("\nДобавь эту строку в .env:");
console.log(`VITE_CONSTRUCTOR_PASSWORD_HASH=${hash}\n`);
