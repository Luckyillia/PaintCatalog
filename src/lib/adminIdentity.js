// Лёгкая "личность" в админке — НЕ настоящая аутентификация. Пароль на
// /admin общий на всех, поэтому это поле нужно только для аудит-лога
// (кто и когда правил) и полагается на то, что человек честно вписал
// своё имя. Если понадобится настоящая проверка личности — единственный
// надёжный вариант это отдельные учётки (Supabase Auth) на каждого
// админа, а не общий пароль.

const ADMIN_NAME_KEY = "osnova-admin-name";

export function getAdminName() {
  return (localStorage.getItem(ADMIN_NAME_KEY) || "").trim();
}

export function setAdminName(name) {
  const trimmed = (name || "").trim().slice(0, 60);
  if (trimmed) localStorage.setItem(ADMIN_NAME_KEY, trimmed);
  else localStorage.removeItem(ADMIN_NAME_KEY);
}

// То, что реально уходит в edited_by. Если имя не задано, БД всё равно
// подставит "unknown" через триггер, но лучше отправлять явно.
export function currentEditor() {
  return getAdminName() || "unknown";
}