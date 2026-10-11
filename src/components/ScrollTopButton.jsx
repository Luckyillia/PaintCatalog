import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

// Кнопка «Наверх»: появляется после прокрутки, пригодится в длинных списках.
export default function ScrollTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 600);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  function toTop() {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label="Наверх"
      title="Наверх"
      className="fixed right-4 bottom-20 sm:bottom-5 z-30 w-10 h-10 rounded-full border border-hair bg-panel/95 backdrop-blur text-mute hover:text-signal hover:border-signal/50 shadow-lg flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-signal focus-visible:outline-offset-2"
    >
      <ArrowUp size={18} />
    </button>
  );
}
