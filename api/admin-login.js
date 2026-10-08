import { isAuthConfigured, resolveUserName, verifyPassword, signToken } from "./_lib/auth.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Простой ограничитель неудачных попыток. На serverless память живёт
// только в пределах одного инстанса, поэтому это лишь первая линия —
// для настоящей защиты включи rate limit в Vercel Firewall для /api/admin-login.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILS = 8;
const fails = new Map(); // ip -> { count, resetAt }

function clientIp(req) {
  const fwd = String(req.headers?.["x-forwarded-for"] || "").split(",")[0].trim();
  return fwd || req.socket?.remoteAddress || "unknown";
}

function isBlocked(ip) {
  const rec = fails.get(ip);
  if (!rec) return false;
  if (rec.resetAt < Date.now()) {
    fails.delete(ip);
    return false;
  }
  return rec.count >= MAX_FAILS;
}

function registerFail(ip) {
  const rec = fails.get(ip);
  if (!rec || rec.resetAt < Date.now()) fails.set(ip, { count: 1, resetAt: Date.now() + WINDOW_MS });
  else rec.count += 1;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!isAuthConfigured()) {
    res.status(500).json({
      error:
        "Админка не настроена на сервере: задай ADMIN_USERS и ADMIN_SESSION_SECRET (от 32 символов) в переменных окружения.",
    });
    return;
  }

  const ip = clientIp(req);
  if (isBlocked(ip)) {
    res.status(429).json({ error: "Слишком много попыток. Подожди несколько минут." });
    return;
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const name = resolveUserName(body.name);

  if (!name || !verifyPassword(name, body.password)) {
    registerFail(ip);
    await sleep(600);
    res.status(401).json({ error: "Неверное имя или пароль" });
    return;
  }

  fails.delete(ip);
  const { token, expiresAt } = signToken(name);
  res.status(200).json({ token, name, expiresAt });
}
