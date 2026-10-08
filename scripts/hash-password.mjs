#!/usr/bin/env node
// Генерирует запись для переменной ADMIN_USERS (scrypt с солью).
// Использование: node scripts/hash-password.mjs "Имя" "мой-пароль"

import { randomBytes, scryptSync } from "node:crypto";

const [name, password] = process.argv.slice(2);

if (!name || !password) {
  console.error('Использование: node scripts/hash-password.mjs "Имя" "мой-пароль"');
  process.exit(1);
}

const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64).toString("hex");
const stored = `scrypt-${salt.toString("hex")}-${hash}`;

console.log("\nЗапись для ADMIN_USERS (несколько админов — через точку с запятой):");
console.log(`${name}:${stored}\n`);
console.log("Старые sha256-хэши тоже продолжают работать — менять можно по одному.\n");
