import { useCallback, useState } from "react";
import { COLOR_FORMAT_IDS } from "./colorFormats";

const KEY = "osnova:color-format";

function read() {
  try {
    const v = localStorage.getItem(KEY);
    return COLOR_FORMAT_IDS.includes(v) ? v : "HEX";
  } catch {
    return "HEX";
  }
}

// Выбранный формат (HEX / RGB / …) запоминается в этом браузере.
export function useColorFormat() {
  const [fmt, setFmt] = useState(read);
  const update = useCallback((next) => {
    setFmt(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // localStorage недоступен — формат просто не запомнится
    }
  }, []);
  return [fmt, update];
}
