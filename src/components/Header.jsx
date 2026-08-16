import { Link } from "react-router-dom";
import { SprayCan, Award } from "lucide-react";

export default function Header() {
  return (
    <header className="border-b border-hair bg-panel/80 backdrop-blur sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center gap-3">
       <Link to="/" className="flex items-center gap-2 group">
          <img
            src="/images/logo.png"
            alt="OSNOVA"
            className="h-16 w-auto"
          />
        </Link>
        <span className="hidden sm:block font-body text-xs text-mute pl-3 border-l border-hair">
          Стайлинг-центр · Каталог стоковой окраски транспорта
        </span>
        <Link
          to="/credits"
          className="ml-auto flex items-center gap-1.5 font-body text-xs text-mute hover:text-signal transition-colors"
        >
          <Award size={14} />
          <span className="hidden sm:inline">Стена почёта</span>
        </Link>
      </div>
    </header>
  );
}