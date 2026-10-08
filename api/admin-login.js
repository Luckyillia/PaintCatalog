import { isAuthConfigured, resolveUserName, verifyPassword, signToken } from "./_lib/auth.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const name = resolveUserName(body.name);

  if (!name || !verifyPassword(name, body.password)) {
    await sleep(600); // небольшая задержка против перебора
    res.status(401).json({ error: "Неверное имя или пароль" });
    return;
  }

  const { token, expiresAt } = signToken(name);
  res.status(200).json({ token, name, expiresAt });
}
