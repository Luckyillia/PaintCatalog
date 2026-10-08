import { useEffect } from "react";

const BASE = "Стайлинг-центр OSNOVA — каталог стоковой окраски";

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · OSNOVA` : BASE;
    return () => {
      document.title = BASE;
    };
  }, [title]);
}
