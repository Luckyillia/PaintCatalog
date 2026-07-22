import { Link } from "react-router-dom";
import { SprayCan } from "lucide-react";

export default function Header() {
  return (
    <header className="border-b border-hair bg-panel/80 backdrop-blur sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="w-9 h-9 rounded-md bg-signal/15 border border-signal/40 flex items-center justify-center text-signal group-hover:bg-signal/25 transition-colors">
            <SprayCan size={18} strokeWidth={2} />
          </span>
          <span className="font-display text-xl tracking-wide text-ink">
            МАЛЯР<span className="text-signal">КА</span>
          </span>
        </Link>
        <span className="hidden sm:block font-body text-xs text-mute pl-3 border-l border-hair">
          Каталог стоковой окраски транспорта
        </span>
      </div>
    </header>
  );
}
