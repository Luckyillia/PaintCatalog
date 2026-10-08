#!/usr/bin/env node
// Генерирует SHA-256 хэш пароля админа для переменной ADMIN_USERS.
// Использование: node scripts/hash-password.mjs "Имя" "мой-пароль"

import { createHash } from "node:crypto";

const [name, password] = process.argv.slice(2);

if (!name || !password) {
  console.error('Использование: node scripts/hash-password.mjs "Имя" "мой-пароль"');
  process.exit(1);
}

const hash = createHash("sha256").update(password, "utf8").digest("hex");

console.log("\nХэш пароля:");
console.log(hash);
console.log("\nЗапись для ADMIN_USERS (несколько админов — через точку с запятой):");
console.log(`${name}:${hash}\n`);
