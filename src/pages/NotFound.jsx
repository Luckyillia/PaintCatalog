import { Link, useLocation } from "react-router-dom";
import { Compass, Home as HomeIcon, Pipette } from "lucide-react";
import Breadcrumbs from "../components/Breadcrumbs";
import { usePageTitle } from "../lib/usePageTitle";

export default function NotFound() {
  usePageTitle("Страница не найдена");
  const { pathname } = useLocation();

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">
      <Breadcrumbs items={[{ label: "Главная", to: "/" }, { label: "Страница не найдена" }]} />

      <section className="border border-hair rounded-lg bg-panel bg-shutter px-8 py-12 text-center">
        <span className="w-12 h-12 mx-auto rounded-md bg-signal/15 border border-signal/40 flex items-center justify-center text-signal mb-4">
          <Compass size={22} strokeWidth={2} />
        </span>
        <span className="font-mono text-xs tracking-[0.2em] text-signal uppercase">Ошибка 404</span>
        <h1 className="font-display text-4xl sm:text-5xl tracking-wide text-ink mt-3">
          Такой страницы нет
        </h1>
        <p className="font-body text-mute mt-4 max-w-xl mx-auto">
          Ссылка неправильная или страница была удалена. Адрес:{" "}
          <span className="font-mono text-ink break-all">{pathname}</span>
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap mt-6">
          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-md bg-signal text-[#06120d] font-body text-sm font-semibold px-4 py-2 hover:bg-signal-bright transition-colors"
          >
            <HomeIcon size={15} />
            На главную
          </Link>
          <Link
            to="/color-search"
            className="flex items-center gap-1.5 rounded-md border border-hair bg-raised px-4 py-2 font-body text-sm text-ink hover:border-signal/50 hover:text-signal transition-colors"
          >
            <Pipette size={15} />
            Поиск по цвету
          </Link>
        </div>
      </section>
    </div>
  );
}
