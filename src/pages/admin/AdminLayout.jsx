import { useEffect, useState } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import {
  ShieldCheck,
  ArrowLeft,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  PlusCircle,
  PenSquare,
  Upload,
  Tags,
  Award,
  Inbox,
  Trash2,
  History,
} from "lucide-react";
import { adminLogin, adminLogout, adminFetch, getAdminName, LOGOUT_EVENT } from "../../lib/adminApi";
import { REPORTS_CHANGED_EVENT } from "../../lib/adminEvents";

// Пароль проверяет сервер (api/admin-login.js). Здесь хранится только имя
// для отображения и токен сессии (см. src/lib/adminApi.js).

// Шапка в два яруса: сверху «На сайт / имя / выход», ниже все разделы с иконками.
// Горизонтальной прокрутки нет: на десктопе пункты переносятся на новую строку,
// на телефоне прячутся в меню-сетку по кнопке.
const NAV_ITEMS = [
  { to: "/admin", label: "Главная", title: "Главная админки", icon: LayoutDashboard, end: true },
  { to: "/admin/vehicle-constructor", label: "Добавить", title: "Добавить машину", icon: PlusCircle },
  { to: "/admin/vehicle-editor", label: "Машины", title: "Редактировать машины", icon: PenSquare },
  { to: "/admin/vehicle-import", label: "Импорт", title: "Массовый импорт машин", icon: Upload },
  { to: "/admin/tags", label: "Теги", title: "Теги и группы", icon: Tags },
  { to: "/admin/credits", label: "Стена почёта", title: "Стена почёта", icon: Award },
  { to: "/admin/reports", label: "Репорты", title: "Репорты посетителей", icon: Inbox, badgeKey: "reports" },
  { to: "/admin/trash", label: "Корзина", title: "Корзина", icon: Trash2 },
  { to: "/admin/audit", label: "Журнал", title: "Журнал изменений", icon: History },
];

export default function AdminLayout() {
  const [adminName, setAdminName] = useState(() => getAdminName());
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [newReports, setNewReports] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function handleLogout() {
      setAdminName("");
      setPassword("");
    }
    window.addEventListener(LOGOUT_EVENT, handleLogout);
    return () => window.removeEventListener(LOGOUT_EVENT, handleLogout);
  }, []);

  // счётчик новых репортов в меню; если таблицы ещё нет — молча без бейджа
  useEffect(() => {
    if (!adminName) return undefined;
    let cancelled = false;
    function load() {
      adminFetch("/api/admin-data", { resource: "reports", countOnly: true })
        .then((json) => {
          if (!cancelled) setNewReports(json.counts?.new ?? 0);
        })
        .catch(() => {});
    }
    load();
    window.addEventListener(REPORTS_CHANGED_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener(REPORTS_CHANGED_EVENT, load);
    };
  }, [adminName]);

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
        <form onSubmit={handleSubmit} className="w-full max-w-sm border border-hair bg-panel rounded-lg p-6">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={18} className="text-signal" />
            <h1 className="font-display text-xl tracking-wide text-ink">Панель администратора</h1>
          </div>
          <p className="font-body text-xs text-mute mb-5">Вход по имени и личному паролю. Имя попадает в лог правок.</p>
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
        <div className="max-w-6xl mx-auto px-5">
          <div className="h-14 flex items-center gap-3">
            <Link
              to="/"
              title="Вернуться на сайт"
              className="flex items-center gap-1.5 font-body text-sm text-mute hover:text-signal transition-colors shrink-0"
            >
              <ArrowLeft size={15} />
              <span className="hidden sm:inline">На сайт</span>
            </Link>
            <span className="w-px h-5 bg-hair shrink-0" />
            <span className="flex items-center gap-1.5 font-display text-lg tracking-wide text-ink whitespace-nowrap">
              <ShieldCheck size={16} className="text-signal" />
              Админка
            </span>

            <span className="ml-auto min-w-0 truncate font-body text-xs text-mute">{adminName}</span>
            <button
              onClick={adminLogout}
              className="shrink-0 flex items-center gap-1.5 font-body text-xs text-mute hover:text-signal transition-colors"
              title="Выйти"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Выйти</span>
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls="admin-nav"
              aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
              className="lg:hidden relative shrink-0 flex items-center justify-center w-9 h-9 rounded-md border border-hair bg-raised text-mute hover:text-signal transition-colors"
            >
              {menuOpen ? <X size={16} /> : <Menu size={16} />}
              {!menuOpen && newReports > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-signal" />
              )}
            </button>
          </div>

          <nav
            id="admin-nav"
            aria-label="Разделы админки"
            className={`${
              menuOpen ? "grid grid-cols-2 sm:grid-cols-3 lg:flex" : "hidden lg:flex"
            } lg:flex-wrap gap-1.5 pb-3`}
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={item.title}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 font-body text-sm px-3 py-1.5 rounded-md whitespace-nowrap transition-colors border ${
                    isActive ? "bg-signal/15 text-signal border-signal/40" : "text-mute hover:text-ink border-transparent hover:bg-raised"
                  }`
                }
              >
                <item.icon size={14} className="shrink-0" />
                {item.label}
                {item.badgeKey === "reports" && newReports > 0 && (
                  <span className="font-mono text-[10px] leading-none bg-signal text-[#0a0c0f] rounded-full px-1.5 py-0.5">
                    {newReports}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-5 py-8">
        <Outlet />
      </main>
    </div>
  );
}
