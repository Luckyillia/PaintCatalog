import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export default function Breadcrumbs({ items }) {
  // items: [{ label, to? }] — последний элемент без ссылки
  return (
    <nav className="flex items-center flex-wrap gap-1 font-body text-sm text-mute mb-6">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={14} className="mx-0.5 opacity-60" />}
          {item.to ? (
            <Link to={item.to} className="hover:text-signal transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-ink">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
