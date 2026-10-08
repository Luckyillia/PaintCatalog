import crypto from "node:crypto";

// Общая серверная авторизация админки. Файлы в api/_lib не становятся
// функциями Vercel (префикс "_").
//
// Переменные окружения (только на сервере, БЕЗ префикса VITE_):
//   ADMIN_USERS           — "Имя:хэш;Другое:хэш"
//                           хэш: scrypt-<salt>-<hash> (рекомендуется,
//                           см. scripts/hash-password.mjs) или старый
//                           sha256 из 64 hex-символов — он тоже работает.
//   ADMIN_SESSION_SECRET  — случайная строка от 32 символов (подпись токенов)

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // сессия живёт 12 часов
const MAX_PASSWORD_LEN = 256;
const DUMMY_SALT = Buffer.alloc(16);

function getSecret() {
  const s = process.env.ADMIN_SESSION_SECRET || "";
  return s.length >= 32 ? s : "";
}

export function isAuthConfigured() {
  return Boolean(getSecret()) && getUsers().size > 0;
}

function isStoredHash(h) {
  return /^[0-9a-f]{64}$/.test(h) || /^scrypt-[0-9a-f]{32}-[0-9a-f]{128}$/.test(h);
}

export function getUsers() {
  const out = new Map();
  for (const part of (process.env.ADMIN_USERS || "").split(";")) {
    const idx = part.indexOf(":");
    if (idx <= 0) continue;
    const name = part.slice(0, idx).trim();
    const hash = part.slice(idx + 1).trim().toLowerCase();
    if (name && isStoredHash(hash)) out.set(name, hash);
  }
  return out;
}

// Имя вводится без учёта регистра, но дальше везде используется
// каноническое написание из ADMIN_USERS.
export function resolveUserName(input) {
  const wanted = String(input || "").trim().toLowerCase();
  if (!wanted) return null;
  for (const name of getUsers().keys()) {
    if (name.toLowerCase() === wanted) return name;
  }
  return null;
}

function safeEqual(a, b) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

export function verifyPassword(name, password) {
  const stored = getUsers().get(name);
  const pw = String(password ?? "");
  if (pw.length > MAX_PASSWORD_LEN) return false;

  if (!stored) {
    // фиктивный расчёт — время ответа не выдаёт, существует ли имя
    crypto.scryptSync(pw, DUMMY_SALT, 64);
    return false;
  }

  if (stored.startsWith("scrypt-")) {
    const [, saltHex, hashHex] = stored.split("-");
    const derived = crypto.scryptSync(pw, Buffer.from(saltHex, "hex"), 64).toString("hex");
    return safeEqual(derived, hashHex);
  }

  // старый формат: sha256 без соли
  const hash = crypto.createHash("sha256").update(pw, "utf8").digest("hex");
  return safeEqual(hash, stored);
}

export function signToken(name) {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ n: name, e: expiresAt })).toString("base64url");
  const sig = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return { token: `${payload}.${sig}`, expiresAt };
}

export function verifyToken(token) {
  const secret = getSecret();
  if (!secret || typeof token !== "string") return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  if (!safeEqual(sig, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data?.n || !(data.e > Date.now())) return null;
    // если пользователя убрали из ADMIN_USERS — его токен сразу перестаёт работать
    if (!getUsers().has(data.n)) return null;
    return { name: data.n, expiresAt: data.e };
  } catch {
    return null;
  }
}

// Возвращает { name } или сам отправляет 401/500 и возвращает null.
export function requireAdmin(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!isAuthConfigured()) {
    res.status(500).json({
      error:
        "Админка не настроена на сервере: задай ADMIN_USERS и ADMIN_SESSION_SECRET (от 32 символов) в переменных окружения.",
    });
    return null;
  }
  const header = String(req.headers?.authorization || "");
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const admin = verifyToken(token);
  if (!admin) {
    res.status(401).json({ error: "Нет доступа: войди в админку заново." });
    return null;
  }
  return admin;
}
