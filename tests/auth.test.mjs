import test, { beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  getUsers,
  isAuthConfigured,
  resolveUserName,
  verifyPassword,
  signToken,
  verifyToken,
  requireAdmin,
} from "../api/_lib/auth.js";

function scryptEntry(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt-${salt.toString("hex")}-${hash}`;
}
const sha256 = (pw) => crypto.createHash("sha256").update(pw, "utf8").digest("hex");

const SECRET = "x".repeat(40);
let saved;

beforeEach(() => {
  saved = { users: process.env.ADMIN_USERS, secret: process.env.ADMIN_SESSION_SECRET };
  process.env.ADMIN_USERS = `Illia:${scryptEntry("правильный-пароль")};Старый:${sha256("legacy-pass")}`;
  process.env.ADMIN_SESSION_SECRET = SECRET;
});

afterEach(() => {
  mock.restoreAll();
  for (const [k, v] of [["ADMIN_USERS", saved.users], ["ADMIN_SESSION_SECRET", saved.secret]]) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

function fakeRes() {
  return {
    headers: {},
    code: 200,
    body: null,
    setHeader(k, v) { this.headers[k] = v; },
    status(c) { this.code = c; return this; },
    json(b) { this.body = b; },
  };
}

test("getUsers разбирает scrypt и sha256, мусор пропускает", () => {
  process.env.ADMIN_USERS += ";Битый:не-хэш;:нет-имени;без-двоеточия";
  assert.deepEqual([...getUsers().keys()], ["Illia", "Старый"]);
});

test("isAuthConfigured требует секрет от 32 символов и хотя бы одного админа", () => {
  assert.equal(isAuthConfigured(), true);
  process.env.ADMIN_SESSION_SECRET = "короткий";
  assert.equal(isAuthConfigured(), false);
  process.env.ADMIN_SESSION_SECRET = SECRET;
  process.env.ADMIN_USERS = "";
  assert.equal(isAuthConfigured(), false);
});

test("resolveUserName не зависит от регистра и возвращает каноническое имя", () => {
  assert.equal(resolveUserName("  iLLia "), "Illia");
  assert.equal(resolveUserName("нет такого"), null);
  assert.equal(resolveUserName(""), null);
});

test("verifyPassword: scrypt, старый sha256, неверный пароль, неизвестный пользователь", () => {
  assert.equal(verifyPassword("Illia", "правильный-пароль"), true);
  assert.equal(verifyPassword("Illia", "неправильный"), false);
  assert.equal(verifyPassword("Старый", "legacy-pass"), true);
  assert.equal(verifyPassword("Старый", "другой"), false);
  assert.equal(verifyPassword("Призрак", "что-угодно"), false);
  assert.equal(verifyPassword("Illia", "x".repeat(300)), false);
  assert.equal(verifyPassword("Illia", undefined), false);
});

test("токен: подпись и проверка в обе стороны", () => {
  const { token, expiresAt } = signToken("Illia");
  assert.ok(expiresAt > Date.now());
  assert.deepEqual(verifyToken(token), { name: "Illia", expiresAt });
});

test("токен: подделка, чужой секрет и мусор не проходят", () => {
  const { token } = signToken("Illia");
  const [payload, sig] = token.split(".");
  const forged = Buffer.from(JSON.stringify({ n: "Illia", e: Date.now() + 1e9 })).toString("base64url");
  assert.equal(verifyToken(`${forged}.${sig}`), null);
  assert.equal(verifyToken(`${payload}.${sig.slice(0, -2)}AA`), null);
  assert.equal(verifyToken("мусор"), null);
  assert.equal(verifyToken(undefined), null);
  process.env.ADMIN_SESSION_SECRET = "y".repeat(40);
  assert.equal(verifyToken(token), null);
});

test("токен истекает через 12 часов", () => {
  const { token } = signToken("Illia");
  const now = Date.now();
  mock.method(Date, "now", () => now + 12 * 60 * 60 * 1000 + 1000);
  assert.equal(verifyToken(token), null);
});

test("токен перестаёт работать, если админа убрали из ADMIN_USERS", () => {
  const { token } = signToken("Старый");
  assert.ok(verifyToken(token));
  process.env.ADMIN_USERS = `Illia:${scryptEntry("x")}`;
  assert.equal(verifyToken(token), null);
});

test("requireAdmin: нет заголовка → 401, верный токен → { name }", () => {
  const bad = fakeRes();
  assert.equal(requireAdmin({ headers: {} }, bad), null);
  assert.equal(bad.code, 401);
  assert.equal(bad.headers["Cache-Control"], "no-store");

  const { token } = signToken("Illia");
  const ok = fakeRes();
  assert.equal(requireAdmin({ headers: { authorization: `Bearer ${token}` } }, ok).name, "Illia");
});

test("requireAdmin: без настроек сервера → 500", () => {
  process.env.ADMIN_USERS = "";
  const res = fakeRes();
  assert.equal(requireAdmin({ headers: {} }, res), null);
  assert.equal(res.code, 500);
});
