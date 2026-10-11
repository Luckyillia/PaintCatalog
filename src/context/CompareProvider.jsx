import { useEffect, useState, useCallback } from "react";
import { CompareContext } from "./CompareContext";
import { COMPARE_LIMIT, decodeCompare, encodeCompare, sameItem } from "../lib/compare";

const KEY = "osnova:compare";

// В localStorage лежит та же строка, что и в ссылке /compare?c=…,
// поэтому всё, что туда попало, чистится одним decodeCompare.
function readItems() {
  try {
    return decodeCompare(localStorage.getItem(KEY) || "");
  } catch {
    return [];
  }
}

function writeItems(items) {
  try {
    localStorage.setItem(KEY, encodeCompare(items));
  } catch {
    // localStorage недоступен (приватный режим и т.п.) — молча игнорируем
  }
}

export function CompareProvider({ children }) {
  const [items, setItems] = useState(readItems);

  useEffect(() => writeItems(items), [items]);

  // синхронизация между вкладками
  useEffect(() => {
    function handleStorage(e) {
      if (e.key === KEY) setItems(readItems());
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const toggle = useCallback((slug, colorId) => {
    setItems((prev) => {
      const item = { slug, colorId };
      if (prev.some((i) => sameItem(i, item))) return prev.filter((i) => !sameItem(i, item));
      if (prev.length >= COMPARE_LIMIT) return prev;
      return [...prev, item];
    });
  }, []);

  const remove = useCallback((slug, colorId) => {
    setItems((prev) => prev.filter((i) => !sameItem(i, { slug, colorId })));
  }, []);

  const replaceAll = useCallback((next) => setItems(decodeCompare(encodeCompare(next))), []);
  const clear = useCallback(() => setItems([]), []);
  const has = useCallback((slug, colorId) => items.some((i) => sameItem(i, { slug, colorId })), [items]);

  return (
    <CompareContext.Provider
      value={{ items, toggle, remove, replaceAll, clear, has, isFull: items.length >= COMPARE_LIMIT }}
    >
      {children}
    </CompareContext.Provider>
  );
}
