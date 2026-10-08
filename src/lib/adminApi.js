// Клиентская часть админ-авторизации. Пароль проверяет СЕРВЕР
// (api/admin-login.js) и выдаёт подписанный токен; здесь токен лежит в
// sessionStorage и отправляется в каждый запрос записи. Сам по себе
// клиентский токен ничего не защищает — всё решает проверка на сервере.

const SESSION_KEY = "osnova-admin-session";
export const LOGOUT_EVENT = "osnova-admin-logout";

function readSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s?.token || !s?.name || !(s.expiresAt > Date.now())) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function getSession() {
  return readSession();
}

// Только для отображения в интерфейсе. Реальное имя в edited_by
// ставит сервер из токена.
export function getAdminName() {
  return readSession()?.name || "";
}

async function parseJson(res) {
  const text = await res.text().catch(() => "");
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { error: text.slice(0, 200) };
  }
}

export async function adminLogin(name, password) {
  const res = await fetch("/api/admin-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, password }),
  });
  const json = await parseJson(res);
  if (!res.ok) {
    throw new Error(json.error || `Ошибка входа (${res.status})`);
  }
  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ token: json.token, name: json.name, expiresAt: json.expiresAt })
  );
  return json.name;
}

export function adminLogout() {
  sessionStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(LOGOUT_EVENT));
}

// POST JSON на защищённую функцию с токеном. При 401 сессия сбрасывается
// и админка показывает форму входа.
export async function adminFetch(path, body) {
  const session = readSession();
  if (!session) {
    adminLogout();
    throw new Error("Сессия истекла, войди заново");
  }
  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.token}`,
    },
    body: JSON.stringify(body),
  });
  const json = await parseJson(res);
  if (res.status === 401) {
    adminLogout();
    throw new Error(json.error || "Сессия истекла, войди заново");
  }
  if (!res.ok) {
    throw new Error(json.error || `Ошибка сервера (${res.status})`);
  }
  return json;
}

// Запись в Supabase через api/admin-db.js.
// action: "insert" | "upsert" (rows) | "update" (keyValue, patch) | "delete" (keyValue)
export async function adminDb(table, action, params = {}) {
  const json = await adminFetch("/api/admin-db", { table, action, ...params });
  return json.data ?? null;
}
