import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Award, Lock, Heart, Search, Pipette } from "lucide-react";
import { useFavorites } from "../context/FavoritesContext";
import SearchPalette from "./SearchPalette";

export default function Header() {
  const { favorites } = useFavorites();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function handleKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // p-2.5: на телефоне зона нажатия около 40px вместо 14px иконки
  const linkCls =
    "flex items-center gap-1.5 font-body text-xs text-mute hover:text-signal transition-colors p-2.5 rounded-md";

  return (
    <header className="border-b border-hair bg-panel/80 backdrop-blur sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-3 sm:px-5 h-16 flex items-center gap-2 sm:gap-3">
        <Link to="/" className="flex items-center gap-2 group shrink min-w-0">
          <img src="/images/logo.png" alt="OSNOVA" className="h-16 w-auto max-w-[34vw] sm:max-w-none object-contain object-left" />
        </Link>
        <span className="hidden lg:block font-body text-xs text-mute pl-3 border-l border-hair">
          Стайлинг-центр · Каталог стоковой окраски транспорта
        </span>

        <div className="ml-auto flex items-center gap-0 sm:gap-2 shrink-0">
          <button type="button" onClick={() => setSearchOpen(true)} className={linkCls} aria-label="Поиск">
            <Search size={16} />
            <span className="hidden sm:inline">Поиск</span>
            <kbd className="hidden md:inline font-mono text-[10px] border border-hair rounded px-1 py-0.5">Ctrl K</kbd>
          </button>

          <Link to="/color-search" className={linkCls} aria-label="Поиск по цвету">
            <Pipette size={16} />
            <span className="hidden sm:inline">По цвету</span>
          </Link>

          <Link to="/favorites" className={linkCls} aria-label="Избранное">
            <Heart size={16} />
            <span className="hidden sm:inline">Избранное</span>
            {favorites.length > 0 && (
              <span className="font-mono text-[10px] leading-none bg-signal text-[#0a0c0f] rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                {favorites.length}
              </span>
            )}
          </Link>

          <Link to="/credits" className={linkCls} aria-label="Стена почёта">
            <Award size={16} />
            <span className="hidden sm:inline">Стена почёта</span>
          </Link>

          <Link
            to="/admin"
            aria-label="Админка"
            title="Админка"
            className="flex items-center justify-center w-9 h-9 rounded text-mute opacity-20 hover:opacity-100 hover:text-signal transition-opacity"
          >
            <Lock size={13} />
          </Link>
        </div>
      </div>
      {searchOpen && <SearchPalette onClose={() => setSearchOpen(false)} />}
    </header>
  );
}
