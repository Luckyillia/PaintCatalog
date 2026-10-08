import { useEffect, useState } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import { ShieldCheck, ArrowLeft, LogOut } from "lucide-react";
import { adminLogin, adminLogout, getAdminName, LOGOUT_EVENT } from "../../lib/adminApi";

// Пароль проверяет сервер (api/admin-login.js), у каждого админа он свой.
// Здесь хранится только имя для отображения и токен сессии (см.
// src/lib/adminApi.js). Имя в логе правок (edited_by) ставит сервер.

const NAV_ITEMS = [
  { to: "/admin", label: "Главная", end: true },
  { to: "/admin/vehicle-constructor", label: "Добавить машину" },
  { to: "/admin/vehicle-editor", label: "Редактировать машины" },
  { to: "/admin/tags", label: "Теги и группы" },
  { to: "/admin/credits", label: "Стена почёта" },
];

export default function AdminLayout() {
  const [adminName, setAdminName] = useState(() => getAdminName());
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  // adminFetch сбрасывает сессию при 401 / истёкшем токене и шлёт это событие
  useEffect(() => {
    function handleLogout() {
      setAdminName("");
      setPassword("");
    }
    window.addEventListener(LOGOUT_EVENT, handleLogout);
    return () => window.removeEventListener(LOGOUT_EVENT, handleLogout);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setChecking(true);
    setError("");
    try {
      const canonicalName = await adminLogin(name, password);
      setAdminName(canonicalName);
      setPassword("");
    } catch (err) {
      setError(err.message);
      setPassword("");
    } finally {
      setChecking(false);
    }
  }

  if (!adminName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base px-5">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm border border-hair bg-panel rounded-lg p-6"
        >
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={18} className="text-signal" />
            <h1 className="font-display text-xl tracking-wide text-ink">
              Панель администратора
            </h1>
          </div>
          <p className="font-body text-xs text-mute mb-5">
            Вход по имени и личному паролю. Имя попадает в лог правок.
          </p>
          <input
            autoFocus
            autoComplete="username"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Имя"
            className="w-full bg-raised border border-hair rounded-md px-3 py-2.5 font-body text-sm text-ink focus:outline-none focus:border-signal/50 transition-colors mb-3"
          />
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            className="w-full bg-raised border border-hair rounded-md px-3 py-2.5 font-body text-sm text-ink focus:outline-none focus:border-signal/50 transition-colors mb-3"
          />
          {error && <p className="font-body text-xs text-amber mb-3">{error}</p>}
          <button
            type="submit"
            disabled={checking || !name.trim() || !password}
            className="w-full rounded-md bg-signal text-[#06120d] font-body text-sm font-semibold py-2.5 hover:bg-signal-bright transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checking ? "Проверяю..." : "Войти"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base text-ink">
      <header className="border-b border-hair bg-panel/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center gap-4 overflow-x-auto chip-scroll">

          <Link
            to="/"
            title="Вернуться на сайт"
            className="flex items-center gap-1.5 font-body text-sm text-mute hover:text-signal transition-colors shrink-0"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">На сайт</span>
          </Link>
          <span className="w-px h-5 bg-hair shrink-0" />
          <span className="font-display text-lg tracking-wide text-ink whitespace-nowrap">
            Админка
          </span>
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `font-body text-sm px-3 py-1.5 rounded-md whitespace-nowrap transition-colors border ${
                    isActive
                      ? "bg-signal/15 text-signal border-signal/40"
                      : "text-mute hover:text-ink border-transparent"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <span className="ml-auto shrink-0 font-body text-xs text-mute whitespace-nowrap">
            {adminName}
          </span>
          <button
            onClick={adminLogout}
            className="shrink-0 flex items-center gap-1.5 font-body text-xs text-mute hover:text-signal transition-colors"
            title="Выйти"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Выйти</span>
          </button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-5 py-8">
        <Outlet />
      </main>
    </div>
  );
}
